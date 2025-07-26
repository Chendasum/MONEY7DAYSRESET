const { db } = require('../server/storage');
const { users } = require('../shared/schema');
const { eq, gte, desc, asc } = require('drizzle-orm');

class User {
  static async findOne(condition) {
    if (condition.telegram_id) {
      const result = await db.select().from(users).where(eq(users.telegram_id, condition.telegram_id));
      return result[0] || null;
    }
    if (condition.telegramId) {
      const result = await db.select().from(users).where(eq(users.telegram_id, condition.telegramId));
      return result[0] || null;
    }
    return null;
  }

  static async findOneAndUpdate(condition, updates, options = {}) {
    const { upsert = false } = options;
    
    if (condition.telegram_id || condition.telegramId) {
      try {
        const existing = await this.findOne(condition);
        
        if (existing) {
          // Update existing user - only update if there are valid updates
          const validUpdates = Object.fromEntries(
            Object.entries(updates).filter(([key, value]) => 
              key !== '$inc' && value !== undefined && value !== null
            )
          );
          
          if (Object.keys(validUpdates).length > 0) {
            const result = await db
              .update(users)
              .set({ ...validUpdates, last_active: new Date() })
              .where(eq(users.telegram_id, condition.telegram_id || condition.telegramId))
              .returning();
            return result[0];
          }
          return existing;
        } else if (upsert) {
          // Insert new user
          const result = await db
            .insert(users)
            .values({ telegram_id: condition.telegram_id || condition.telegramId, ...updates, last_active: new Date() })
            .returning();
          return result[0];
        }
      } catch (error) {
        console.error('Database error in findOneAndUpdate:', error.message);
        return null;
      }
    }
    
    return null;
  }

  static async updateLastActive(telegramId) {
    try {
      await db
        .update(users)
        .set({ last_active: new Date() })
        .where(eq(users.telegram_id, telegramId));
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  }

  static async findAll() {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    }
  }


}

module.exports = User;
