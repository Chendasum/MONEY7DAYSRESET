const { db } = require('../server/storage');
const { progress } = require('../shared/schema');
const { eq } = require('drizzle-orm');

class Progress {
  static async findOne(condition) {
    if (condition.userId || condition.user_id) {
      const id = condition.userId || condition.user_id;
      const result = await db.select().from(progress).where(eq(progress.user_id, id));
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
        // Only update fields that exist in the progress schema
        const validFields = [
          'user_id', 'current_day', 'ready_for_day_1', 
          'day_0_completed', 'day_1_completed', 'day_2_completed', 'day_3_completed',
          'day_4_completed', 'day_5_completed', 'day_6_completed', 'day_7_completed',
          'program_completed', 'program_completed_at', 'responses', 'created_at', 'updated_at'
        ];
        
        const safeUpdates = {};
        Object.entries(updates).forEach(([key, value]) => {
          if (validFields.includes(key) && value !== undefined && value !== null) {
            safeUpdates[key] = value;
          }
        });
        
        if (Object.keys(safeUpdates).length > 0) {
          safeUpdates.updated_at = new Date();
          const result = await db
            .update(progress)
            .set(safeUpdates)
            .where(eq(progress.user_id, id))
            .returning();
          return result[0];
        }
        return existing;
      } else if (upsert) {
        // Insert new progress with only valid fields
        const insertData = { 
          user_id: id, 
          created_at: new Date(), 
          updated_at: new Date() 
        };
        
        const validFields = [
          'current_day', 'ready_for_day_1', 
          'day_0_completed', 'day_1_completed', 'day_2_completed', 'day_3_completed',
          'day_4_completed', 'day_5_completed', 'day_6_completed', 'day_7_completed',
          'program_completed', 'program_completed_at', 'responses'
        ];
        
        Object.entries(updates).forEach(([key, value]) => {
          if (validFields.includes(key) && value !== undefined && value !== null) {
            insertData[key] = value;
          }
        });
        
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
