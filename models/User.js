const { db } = require('../server/storage');
const { users } = require('../shared/schema');
const { eq, gte, desc, asc } = require('drizzle-orm');

class User {
  static async findOne(condition) {
    if (condition.telegram_id || condition.telegramId) {
      const id = condition.telegram_id || condition.telegramId;
      const result = await db.select().from(users).where(eq(users.telegram_id, id));
      return result[0] || null;
    }
    return null;
  }

  static async findOneAndUpdate(condition, updates, options = {}) {
    const { upsert = false } = options;
    
    if (condition.telegram_id || condition.telegramId) {
      try {
        const id = condition.telegram_id || condition.telegramId;
        const existing = await this.findOne(condition);
        
        if (existing) {
          // Only update fields that exist in the users schema
          const validFields = [
            'telegram_id', 'username', 'first_name', 'last_name', 'phone_number', 
            'email', 'joined_at', 'is_paid', 'payment_date', 'transaction_id', 
            'is_vip', 'tier', 'tier_price', 'last_active', 'timezone', 
            'testimonials', 'testimonial_requests', 'upsell_attempts', 'conversion_history'
          ];
          
          const safeUpdates = {};
          Object.entries(updates).forEach(([key, value]) => {
            // Map old field names to new field names
            let actualKey = key;
            if (key === 'telegramId') actualKey = 'telegram_id';
            if (key === 'firstName') actualKey = 'first_name';
            if (key === 'lastName') actualKey = 'last_name';
            if (key === 'phoneNumber') actualKey = 'phone_number';
            if (key === 'joinedAt') actualKey = 'joined_at';
            if (key === 'isPaid') actualKey = 'is_paid';
            if (key === 'paymentDate') actualKey = 'payment_date';
            if (key === 'transactionId') actualKey = 'transaction_id';
            if (key === 'isVip') actualKey = 'is_vip';
            if (key === 'tierPrice') actualKey = 'tier_price';
            if (key === 'lastActive') actualKey = 'last_active';
            if (key === 'testimonialRequests') actualKey = 'testimonial_requests';
            if (key === 'upsellAttempts') actualKey = 'upsell_attempts';
            if (key === 'conversionHistory') actualKey = 'conversion_history';
            
            if (validFields.includes(actualKey) && value !== undefined && value !== null && key !== '$inc') {
              safeUpdates[actualKey] = value;
            }
          });
          
          if (Object.keys(safeUpdates).length > 0) {
            safeUpdates.last_active = new Date();
            const result = await db
              .update(users)
              .set(safeUpdates)
              .where(eq(users.telegram_id, id))
              .returning();
            return result[0];
          }
          return existing;
        } else if (upsert) {
          // Insert new user with only valid fields
          const insertData = { 
            telegram_id: id, 
            last_active: new Date() 
          };
          
          const validFields = [
            'username', 'first_name', 'last_name', 'phone_number', 
            'email', 'joined_at', 'is_paid', 'payment_date', 'transaction_id', 
            'is_vip', 'tier', 'tier_price', 'timezone', 
            'testimonials', 'testimonial_requests', 'upsell_attempts', 'conversion_history'
          ];
          
          Object.entries(updates).forEach(([key, value]) => {
            // Map old field names to new field names
            let actualKey = key;
            if (key === 'telegramId') actualKey = 'telegram_id';
            if (key === 'firstName') actualKey = 'first_name';
            if (key === 'lastName') actualKey = 'last_name';
            if (key === 'phoneNumber') actualKey = 'phone_number';
            if (key === 'joinedAt') actualKey = 'joined_at';
            if (key === 'isPaid') actualKey = 'is_paid';
            if (key === 'paymentDate') actualKey = 'payment_date';
            if (key === 'transactionId') actualKey = 'transaction_id';
            if (key === 'isVip') actualKey = 'is_vip';
            if (key === 'tierPrice') actualKey = 'tier_price';
            if (key === 'lastActive') actualKey = 'last_active';
            if (key === 'testimonialRequests') actualKey = 'testimonial_requests';
            if (key === 'upsellAttempts') actualKey = 'upsell_attempts';
            if (key === 'conversionHistory') actualKey = 'conversion_history';
            
            if (validFields.includes(actualKey) && value !== undefined && value !== null) {
              insertData[actualKey] = value;
            }
          });
          
          const result = await db
            .insert(users)
            .values(insertData)
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
    await db
      .update(users)
      .set({ last_active: new Date() })
      .where(eq(users.telegram_id, telegramId));
  }

  static async findAll(options = {}) {
    let query = db.select().from(users);

    // Add where conditions if provided
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (key === 'lastActive' && value.gte) {
          query = query.where(gte(users.last_active, value.gte));
        }
      });
    }

    // Add ordering if provided
    if (options.orderBy) {
      Object.entries(options.orderBy).forEach(([key, direction]) => {
        if (key === 'lastActive') {
          query = query.orderBy(direction === 'desc' ? desc(users.last_active) : asc(users.last_active));
        }
      });
    }

    return await query;
  }
}

module.exports = User;
