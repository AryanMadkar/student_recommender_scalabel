const collegeService = require('../services/college.service');
const College = require('../models/College');

class CollegeController {
  // Get college recommendations based on location
  async getCollegeRecommendations(req, res) {
    try {
      const userId = req.header('user-id');
      const studentData = req.body;

      if (!studentData.location || !studentData.stream) {
        return res.status(400).json({
          success: false,
          message: 'Location and stream are required'
        });
      }

      const recommendations = await collegeService.getCollegeRecommendations(
        userId,
        studentData
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('College recommendation error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search colleges with filters
  async searchColleges(req, res) {
    try {
      const filters = {
        city: req.query.city,
        state: req.query.state,
        stream: req.query.stream,
        type: req.query.type,
        minRating: req.query.minRating,
        maxFees: req.query.maxFees,
        limit: parseInt(req.query.limit) || 20,
        skip: parseInt(req.query.skip) || 0
      };

      const result = await collegeService.searchColleges(filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get college details
  async getCollegeById(req, res) {
    try {
      const { collegeId } = req.params;

      const college = await College.findById(collegeId);

      if (!college) {
        return res.status(404).json({
          success: false,
          message: 'College not found'
        });
      }

      res.json({
        success: true,
        data: college
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get colleges by city
  async getCollegesByCity(req, res) {
    try {
      const { city } = req.params;
      const { stream, type } = req.query;

      const query = {
        'location.city': new RegExp(city, 'i'),
        isActive: true
      };

      if (stream) {
        query['courses.eligibility.stream'] = stream;
      }

      if (type) {
        query.type = type;
      }

      const colleges = await College.find(query)
        .select('name shortName type courses ratings placementStats')
        .sort({ 'ratings.overall': -1 })
        .limit(50);

      res.json({
        success: true,
        count: colleges.length,
        data: colleges
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Compare colleges
  async compareColleges(req, res) {
    try {
      const { collegeIds } = req.body;

      if (!collegeIds || collegeIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 college IDs required'
        });
      }

      const colleges = await College.find({
        _id: { $in: collegeIds }
      });

      res.json({
        success: true,
        data: colleges
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CollegeController();
