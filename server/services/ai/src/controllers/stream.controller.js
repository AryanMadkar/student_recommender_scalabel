const streamService = require('../services/stream.service');

class StreamController {
  // Get stream recommendations (after 10th)
  async getStreamRecommendations(req, res) {
    try {
      const userId = req.header('user-id');
      const studentData = req.body;

      // Validate required data
      if (!studentData.class10Marks || !studentData.location) {
        return res.status(400).json({
          success: false,
          message: 'Class 10 marks and location are required'
        });
      }

      const recommendations = await streamService.getStreamRecommendations(
        userId,
        studentData
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Stream recommendation error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new StreamController();
