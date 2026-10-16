const express = require("express");
const router = express.Router();
const SiteSetting = require("../model/SiteSetting");
const { protect, authorize } = require("../middleware/authMiddleware");

// Default Fallback Hero Configuration (Exact original video & text)
const DEFAULT_HERO_SETTINGS = {
  key: "hero_settings",
  heroMediaType: "default",
  heroImageUrl: "",
  heroVideoUrl: "",
  heroBadge: "TRACE COMMUNITY HUB, SRI LANKA",
  heroTitle: "Where innovation meets community and culture.",
  heroSubtitle:
    "From Shed sessions to Midweek Boost evenings, discover and register for the events shaping TRACE Expert City — then keep every one of them in view.",
};

// GET /api/settings/hero - Public endpoint for frontend HeroSection
router.get("/hero", async (req, res) => {
  try {
    let setting = await SiteSetting.findOne({ key: "hero_settings" });
    if (!setting) {
      setting = DEFAULT_HERO_SETTINGS;
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    console.error("Error fetching hero settings:", error);
    res.json({ success: true, data: DEFAULT_HERO_SETTINGS });
  }
});

// PUT /api/settings/hero - Admin endpoint to update hero media & banner
router.put("/hero", protect, authorize("admin", "super_admin", "branch_admin"), async (req, res) => {
  try {
    const { heroMediaType, heroImageUrl, heroVideoUrl, heroBadge, heroTitle, heroSubtitle } = req.body;

    let setting = await SiteSetting.findOne({ key: "hero_settings" });
    if (!setting) {
      setting = new SiteSetting({ key: "hero_settings" });
    }

    if (heroMediaType !== undefined) setting.heroMediaType = heroMediaType;
    if (heroImageUrl !== undefined) setting.heroImageUrl = heroImageUrl;
    if (heroVideoUrl !== undefined) setting.heroVideoUrl = heroVideoUrl;
    if (heroBadge !== undefined) setting.heroBadge = heroBadge;
    if (heroTitle !== undefined) setting.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) setting.heroSubtitle = heroSubtitle;

    await setting.save();

    console.log(`[SETTINGS] Hero settings updated: mediaType=${setting.heroMediaType}, imageUrl=${setting.heroImageUrl}, videoUrl=${setting.heroVideoUrl}`);

    res.json({
      success: true,
      message: "Hero section settings updated successfully!",
      data: setting,
    });
  } catch (error) {
    console.error("Error updating hero settings:", error);
    res.status(500).json({ success: false, message: "Failed to update hero settings", error: error.message });
  }
});

module.exports = router;
