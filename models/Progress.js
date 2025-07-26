const { db } = require('../server/storage');
const { progress } = require('../shared/schema');
const { eq } = require('drizzle-orm');

class Progress {
  static async findOne(condition) {
    if (condition.userId || condition.user_id) {
      const id = condition.userId || condition.user_id;
      const result = await db.select().from(progress).where(eq(progress.userId, id));
      return result[0] || null;
    }
    return null;
  }

  static async findOneAndUpdate(condition, updates, options = {}) {
    const { upsert = false } = options;
    
    if (condition.userId || condition.user_id) {
      const id = condition.userId || condition.user_id;
      const existing = await this.findOne(condition);
      
      if (existing) {
        // Update existing progress
        const result = await db
          .update(progress)
          .set({ ...updates, updated_at: new Date() })
          .where(eq(progress.userId, id))
          .returning();
        return result[0];
      } else if (upsert) {
        // Insert new progress - use correct field name
        const insertData = { userId: id, 
          ...updates, 
          created_at: new Date(), 
          updated_at: new Date() 
         };
        const result = await db
          .insert(progress)
          .values(insertData)
          .returning();
        return result[0];
      }
    }
    
    return null;
  }

  static async findAll(options = {}) {
    return await db.select().from(progress);
  }
}

module.exports = Progress;
