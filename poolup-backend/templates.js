const express = require('express');
const router = express.Router();

// Get all pool templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await req.db.all(`
      SELECT pt.*, 
             COUNT(p.id) as usage_count,
             AVG(CASE WHEN p.current_amount_cents >= p.goal_amount_cents THEN 1.0 ELSE 0.0 END) as success_rate
      FROM pool_templates pt
      LEFT JOIN pools p ON pt.id = p.template_id
      WHERE pt.active = 1
      GROUP BY pt.id
      ORDER BY pt.category, pt.popularity_score DESC
    `);
    
    res.json(templates);
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get templates by category
router.get('/templates/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const templates = await req.db.all(`
      SELECT pt.*, 
             COUNT(p.id) as usage_count,
             AVG(CASE WHEN p.current_amount_cents >= p.goal_amount_cents THEN 1.0 ELSE 0.0 END) as success_rate
      FROM pool_templates pt
      LEFT JOIN pools p ON pt.id = p.template_id
      WHERE pt.category = ? AND pt.active = 1
      GROUP BY pt.id
      ORDER BY pt.popularity_score DESC
    `, [category]);
    
    res.json(templates);
  } catch (error) {
    console.error('Category templates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch category templates' });
  }
});

// Create pool from template
router.post('/create-from-template', async (req, res) => {
  try {
    const { templateId, creatorId, customizations } = req.body;
    
    const template = await req.db.get('SELECT * FROM pool_templates WHERE id = ?', [templateId]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Create pool with template defaults + customizations
    const poolData = {
      name: customizations.name || template.default_name,
      goal_amount_cents: customizations.goalAmount || template.suggested_goal_cents,
      destination: customizations.destination || template.default_destination,
      visual_theme: customizations.visualTheme || template.default_theme,
      template_id: templateId,
      creator_id: creatorId,
      pool_type: template.pool_type,
      created_at: new Date().toISOString()
    };
    
    const result = await req.db.run(`
      INSERT INTO pools (name, goal_amount_cents, destination, visual_theme, template_id, creator_id, pool_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      poolData.name,
      poolData.goal_amount_cents,
      poolData.destination,
      poolData.visual_theme,
      poolData.template_id,
      poolData.creator_id,
      poolData.pool_type,
      poolData.created_at
    ]);
    
    // Update template usage
    await req.db.run(`
      UPDATE pool_templates 
      SET usage_count = usage_count + 1,
          popularity_score = popularity_score + 1
      WHERE id = ?
    `, [templateId]);
    
    // Add creator as member
    await req.db.run(`
      INSERT INTO pool_memberships (pool_id, user_id, joined_at)
      VALUES (?, ?, ?)
    `, [result.lastID, creatorId, new Date().toISOString()]);
    
    const newPool = { id: result.lastID, ...poolData };
    res.json(newPool);
  } catch (error) {
    console.error('Template pool creation error:', error);
    res.status(500).json({ error: 'Failed to create pool from template' });
  }
});

// Vote on template suggestions
router.post('/templates/:templateId/vote', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { userId, voteType } = req.body; // 'upvote' or 'downvote'
    
    // Check if user already voted
    const existingVote = await req.db.get(`
      SELECT * FROM template_votes WHERE template_id = ? AND user_id = ?
    `, [templateId, userId]);
    
    if (existingVote) {
      // Update existing vote
      await req.db.run(`
        UPDATE template_votes SET vote_type = ?, voted_at = ?
        WHERE template_id = ? AND user_id = ?
      `, [voteType, new Date().toISOString(), templateId, userId]);
    } else {
      // Create new vote
      await req.db.run(`
        INSERT INTO template_votes (template_id, user_id, vote_type, voted_at)
        VALUES (?, ?, ?, ?)
      `, [templateId, userId, voteType, new Date().toISOString()]);
    }
    
    // Update template popularity score
    const votes = await req.db.get(`
      SELECT 
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
      FROM template_votes WHERE template_id = ?
    `, [templateId]);
    
    const popularityScore = votes.upvotes - votes.downvotes;
    await req.db.run(`
      UPDATE pool_templates SET popularity_score = ? WHERE id = ?
    `, [popularityScore, templateId]);
    
    res.json({ 
      success: true, 
      upvotes: votes.upvotes, 
      downvotes: votes.downvotes,
      popularityScore 
    });
  } catch (error) {
    console.error('Template vote error:', error);
    res.status(500).json({ error: 'Failed to process vote' });
  }
});

// Suggest new template
router.post('/templates/suggest', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      suggestedGoalCents, 
      defaultTheme, 
      suggestedBy,
      poolType = 'group'
    } = req.body;
    
    const result = await req.db.run(`
      INSERT INTO pool_templates (
        name, description, category, suggested_goal_cents, default_theme, 
        suggested_by, pool_type, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      name, description, category, suggestedGoalCents, defaultTheme, 
      suggestedBy, poolType, new Date().toISOString()
    ]);
    
    res.json({ 
      templateId: result.lastID,
      message: 'Template suggestion submitted for review!' 
    });
  } catch (error) {
    console.error('Template suggestion error:', error);
    res.status(500).json({ error: 'Failed to submit template suggestion' });
  }
});

// Get template categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await req.db.all(`
      SELECT 
        category,
        COUNT(*) as template_count,
        AVG(popularity_score) as avg_popularity
      FROM pool_templates 
      WHERE active = 1
      GROUP BY category
      ORDER BY avg_popularity DESC
    `);
    
    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
