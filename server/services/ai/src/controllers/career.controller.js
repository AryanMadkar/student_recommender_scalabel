const careerService = require('../services/career.service');
const Career = require('../models/Career');

class CareerController {
  // Get personalized career recommendations
  async getCareerRecommendations(req, res) {
    try {
      const userId = req.header('user-id');
      const studentData = req.body;

      if (!studentData.stream || !studentData.location) {
        return res.status(400).json({
          success: false,
          message: 'Stream and location are required'
        });
      }

      const recommendations = await careerService.getCareerRecommendations(
        userId,
        studentData
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Career recommendation error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all careers (for browsing)
  async getAllCareers(req, res) {
    try {
      const { category, demand, page = 1, limit = 20 } = req.query;
      
      const query = {};
      if (category) query.category = category;
      if (demand) query['growth.demand'] = demand;

      const careers = await Career.find(query)
        .select('title category description salaryRange growth jobRoles')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ 'salaryRange.entry.max': -1 });

      const total = await Career.countDocuments(query);

      res.json({
        success: true,
        data: {
          careers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get career details by ID
  async getCareerById(req, res) {
    try {
      const { careerId } = req.params;

      const career = await Career.findById(careerId);

      if (!career) {
        return res.status(404).json({
          success: false,
          message: 'Career not found'
        });
      }

      res.json({
        success: true,
        data: career
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Compare multiple careers
  async compareCareers(req, res) {
    try {
      const { careerIds } = req.body;

      if (!careerIds || careerIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 career IDs required for comparison'
        });
      }

      const careers = await Career.find({
        _id: { $in: careerIds }
      });

      res.json({
        success: true,
        data: careers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CareerController();
