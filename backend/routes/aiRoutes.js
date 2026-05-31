const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const Property = require("../models/Property");
const Tenant = require("../models/Tenant");
const Lease = require("../models/Lease");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Initialize Anthropic client — uses ANTHROPIC_API_KEY from .env
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Helper: extract JSON from Claude's response text
// Claude sometimes wraps JSON in markdown code blocks — this handles both cases
const extractJSON = (text) => {
  const clean = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  return JSON.parse(clean);
};

// Helper: call Claude and return a parsed JSON object
const askClaude = async (systemPrompt, userPrompt) => {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return extractJSON(response.content[0].text);
};

// POST /api/ai/rent-suggestion
// Suggests an optimal monthly rent based on property data and lease history
router.post("/rent-suggestion", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ message: "propertyId is required" });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user.id,
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const leases = await Lease.find({ propertyId, owner: req.user.id });
    const activeLease = leases.find((l) => l.status === "active");

    const propertyData = {
      title: property.title,
      location: property.location,
      city: property.city,
      country: property.country,
      currentListedPrice: property.price,
      currency: property.currency,
      status: property.status,
      activeLeaseRent: activeLease ? activeLease.rentAmount : null,
      leaseHistory: leases.map((l) => ({
        rentAmount: l.rentAmount,
        status: l.status,
        durationMonths: Math.ceil(
          (new Date(l.endDate) - new Date(l.startDate)) /
            (1000 * 60 * 60 * 24 * 30),
        ),
      })),
    };

    const systemPrompt = `You are an expert real estate advisor specializing in rental pricing strategy.
Analyze property data and provide data-driven rent recommendations.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.
Use this exact structure:
{
  "suggestedRent": number,
  "currency": "string",
  "marketRange": { "low": number, "high": number },
  "confidence": "low|medium|high",
  "reasoning": "string (2-3 sentences explaining the recommendation)",
  "tips": ["string", "string", "string"]
}`;

    const userPrompt = `Analyze this property and suggest an optimal monthly rental price:\n${JSON.stringify(propertyData, null, 2)}\n\nConsider location, current pricing, lease history, and general market trends for this region.`;

    const result = await askClaude(systemPrompt, userPrompt);
    res.json(result);
  } catch (error) {
    console.error("AI rent suggestion error:", error);
    res.status(500).json({ message: "AI service error: " + error.message });
  }
});

// POST /api/ai/vacancy-prediction
// Predicts how likely a property is to become vacant and when
router.post("/vacancy-prediction", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ message: "propertyId is required" });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user.id,
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const leases = await Lease.find({ propertyId, owner: req.user.id }).sort({
      endDate: 1,
    });
    const tenants = await Tenant.find({ propertyId, owner: req.user.id });
    const maintenance = await MaintenanceRequest.find({
      propertyId,
      owner: req.user.id,
    });

    const today = new Date();
    const activeLease = leases.find((l) => l.status === "active");
    const daysUntilLeaseEnd = activeLease
      ? Math.ceil(
          (new Date(activeLease.endDate) - today) / (1000 * 60 * 60 * 24),
        )
      : null;

    const context = {
      title: property.title,
      location: property.location,
      city: property.city,
      country: property.country,
      status: property.status,
      currentPrice: property.price,
      currency: property.currency,
      tenantCount: tenants.length,
      activeLease: activeLease
        ? {
            rentAmount: activeLease.rentAmount,
            endDate: activeLease.endDate,
            daysRemaining: daysUntilLeaseEnd,
          }
        : null,
      leaseHistory: leases.map((l) => ({
        status: l.status,
        rentAmount: l.rentAmount,
      })),
      openMaintenanceCount: maintenance.filter(
        (m) => m.status === "open" || m.status === "in-progress",
      ).length,
      highPriorityMaintenance: maintenance.filter(
        (m) =>
          (m.priority === "urgent" || m.priority === "high") &&
          m.status !== "resolved" &&
          m.status !== "closed",
      ).length,
    };

    const systemPrompt = `You are an expert property management analyst specializing in vacancy risk prediction.
Analyze property and lease data to predict vacancy risk.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.
Use this exact structure:
{
  "riskLevel": "low|medium|high|critical",
  "riskScore": number (0-100, where 100 is certain vacancy),
  "daysUntilPotentialVacancy": number or null,
  "prediction": "string (2-3 sentences explaining the prediction)",
  "keyFactors": ["string", "string"],
  "recommendations": ["string", "string", "string"]
}`;

    const userPrompt = `Analyze vacancy risk for this property (today: ${today.toISOString().split("T")[0]}):\n${JSON.stringify(context, null, 2)}\n\nConsider lease expiry timeline, tenant stability, maintenance burden, and pricing competitiveness.`;

    const result = await askClaude(systemPrompt, userPrompt);
    res.json(result);
  } catch (error) {
    console.error("AI vacancy prediction error:", error);
    res.status(500).json({ message: "AI service error: " + error.message });
  }
});

// POST /api/ai/generate-description
// Generates a professional marketing description for a property listing
router.post("/generate-description", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ message: "propertyId is required" });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user.id,
    });
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const propertyData = {
      title: property.title,
      location: property.location,
      address: property.address,
      city: property.city,
      country: property.country,
      price: property.price,
      currency: property.currency,
      status: property.status,
      imageCount: property.images ? property.images.length : 0,
    };

    const systemPrompt = `You are a professional real estate copywriter who creates compelling property listings that attract high-quality tenants.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.
Use this exact structure:
{
  "tagline": "string (one punchy, memorable sentence)",
  "description": "string (3-4 sentences, marketing-ready, persuasive)",
  "highlights": ["string", "string", "string", "string"],
  "targetAudience": "string (who this property is ideal for)"
}`;

    const userPrompt = `Write a compelling rental listing for this property:\n${JSON.stringify(propertyData, null, 2)}\n\nMake it professional, engaging, and highlight the best features. Use active voice.`;

    const result = await askClaude(systemPrompt, userPrompt);
    res.json(result);
  } catch (error) {
    console.error("AI description generator error:", error);
    res.status(500).json({ message: "AI service error: " + error.message });
  }
});

// POST /api/ai/portfolio-insights
// Analyzes the user's entire property portfolio and returns strategic insights
router.post("/portfolio-insights", authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id });

    if (properties.length === 0) {
      return res.json({
        portfolioScore: 0,
        summary:
          "No properties found. Add your first property to get AI portfolio insights.",
        strengths: [],
        risks: ["No portfolio data available"],
        recommendations: [
          "Add your first property to start building your portfolio",
        ],
        nextBestAction: "Add a property to get started",
        incomeOptimization: "Start by listing your first rental property",
      });
    }

    const leases = await Lease.find({ owner: req.user.id });
    const maintenance = await MaintenanceRequest.find({ owner: req.user.id });
    const today = new Date();

    const totalValue = properties.reduce(
      (sum, p) => sum + Number(p.price || 0),
      0,
    );
    const occupiedCount = properties.filter(
      (p) => p.status === "occupied",
    ).length;
    const activeLeases = leases.filter((l) => l.status === "active");
    const expiringSoon = leases.filter((l) => {
      const daysLeft = Math.ceil(
        (new Date(l.endDate) - today) / (1000 * 60 * 60 * 24),
      );
      return l.status === "active" && daysLeft <= 30;
    });
    const openMaintenance = maintenance.filter(
      (m) => m.status === "open" || m.status === "in-progress",
    );

    const context = {
      totalProperties: properties.length,
      occupiedCount,
      vacantCount: properties.length - occupiedCount,
      occupancyRate: Math.round((occupiedCount / properties.length) * 100),
      totalPortfolioValue: totalValue,
      averagePropertyValue: Math.round(totalValue / properties.length),
      activeLeases: activeLeases.length,
      leasesExpiringSoon: expiringSoon.length,
      openMaintenanceRequests: openMaintenance.length,
      urgentMaintenance: openMaintenance.filter(
        (m) => m.priority === "urgent" || m.priority === "high",
      ).length,
      monthlyRentalIncome: activeLeases.reduce(
        (sum, l) => sum + Number(l.rentAmount || 0),
        0,
      ),
      properties: properties.map((p) => ({
        title: p.title,
        city: p.city,
        country: p.country,
        price: p.price,
        currency: p.currency,
        status: p.status,
      })),
    };

    const systemPrompt = `You are a senior real estate portfolio manager and investment advisor.
Provide deep, specific, and actionable portfolio analysis.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.
Use this exact structure:
{
  "portfolioScore": number (0-100),
  "summary": "string (2-3 sentences overall portfolio assessment)",
  "strengths": ["string", "string"],
  "risks": ["string", "string"],
  "recommendations": ["string", "string", "string"],
  "nextBestAction": "string (single most important action to take right now)",
  "incomeOptimization": "string (specific advice to maximize rental income)"
}`;

    const userPrompt = `Analyze this real estate portfolio:\n${JSON.stringify(context, null, 2)}\n\nBe specific, data-driven, and actionable. Focus on maximizing returns and reducing risk.`;

    const result = await askClaude(systemPrompt, userPrompt);
    res.json(result);
  } catch (error) {
    console.error("AI portfolio insights error:", error);
    res.status(500).json({ message: "AI service error: " + error.message });
  }
});

// POST /api/ai/occupancy-forecast
// Forecasts month-by-month occupancy for the next 6 months based on lease data
router.post("/occupancy-forecast", authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id });

    if (properties.length === 0) {
      return res.json({
        forecast: [],
        overallTrend: "stable",
        trendReason: "No properties in portfolio",
        criticalPeriod: null,
        actionPlan: [
          "Add properties and leases to enable occupancy forecasting",
        ],
      });
    }

    const leases = await Lease.find({ owner: req.user.id }).sort({ endDate: 1 });
    const today = new Date();

    // Build month-by-month projections for next 6 months
    const monthlyProjections = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        1,
      );
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + i + 1,
        0,
      );
      const label = monthStart.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      const activeInMonth = leases.filter((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        return (
          start <= monthEnd && end >= monthStart && l.status !== "terminated"
        );
      }).length;

      monthlyProjections.push({
        month: label,
        activeLeases: activeInMonth,
        totalProperties: properties.length,
        baselineOccupancyRate: Math.min(
          100,
          Math.round((activeInMonth / properties.length) * 100),
        ),
      });
    }

    const context = {
      totalProperties: properties.length,
      currentOccupied: properties.filter((p) => p.status === "occupied").length,
      activeLeases: leases.filter((l) => l.status === "active").length,
      monthlyProjections,
      upcomingLeaseExpiries: leases
        .filter((l) => l.status === "active")
        .map((l) => ({
          endDate: new Date(l.endDate).toISOString().split("T")[0],
          daysRemaining: Math.ceil(
            (new Date(l.endDate) - today) / (1000 * 60 * 60 * 24),
          ),
        }))
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    };

    const systemPrompt = `You are a real estate forecasting specialist with expertise in occupancy trends.
Analyze lease data and generate accurate occupancy forecasts.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.
Use this exact structure:
{
  "forecast": [
    {
      "month": "string",
      "predictedOccupancyRate": number (0-100),
      "confidence": "low|medium|high",
      "notes": "string (brief insight for this specific month)"
    }
  ],
  "overallTrend": "improving|stable|declining",
  "trendReason": "string (why the trend is what it is)",
  "criticalPeriod": "string or null (which month needs the most attention)",
  "actionPlan": ["string", "string"]
}`;

    const userPrompt = `Forecast occupancy for this portfolio over the next 6 months (today: ${today.toISOString().split("T")[0]}):\n${JSON.stringify(context, null, 2)}\n\nProvide realistic month-by-month predictions and identify periods that need proactive action.`;

    const result = await askClaude(systemPrompt, userPrompt);
    res.json(result);
  } catch (error) {
    console.error("AI occupancy forecast error:", error);
    res.status(500).json({ message: "AI service error: " + error.message });
  }
});

module.exports = router;
