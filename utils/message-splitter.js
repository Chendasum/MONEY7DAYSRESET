async function sendLongMessage(bot, chatId, message, options = {}, chunkSize = 4090) {
  try {
    if (!message || message.length === 0) {
      console.log("Empty message, skipping send");
      return;
    }

    const maxLength = 4090; // Use maximum safe limit near Telegram's 4096 limit
    
    if (message.length <= maxLength) {
      return await bot.sendMessage(chatId, message, options);
    }
    
    console.log(`📝 Splitting long message (${message.length} chars) into MINIMAL chunks for chat ${chatId}`);
    console.log(`📏 Using maxLength: ${maxLength} chars`);
    
    const chunks = [];
    
    // SUPER AGGRESSIVE: Split text into minimal number of chunks
    let startIndex = 0;
    
    while (startIndex < message.length) {
      let endIndex = Math.min(startIndex + maxLength, message.length);
      let chunk = message.substring(startIndex, endIndex);
      
      // If we're not at the end and we cut off mid-line, find the last newline
      if (endIndex < message.length) {
        const lastNewline = chunk.lastIndexOf('\n');
        if (lastNewline > maxLength * 0.7) { // Only adjust if we're not losing too much content
          endIndex = startIndex + lastNewline;
          chunk = message.substring(startIndex, endIndex);
        }
      }
      
      if (chunk.trim()) {
        chunks.push(chunk.trim());
        console.log(`📦 Created chunk ${chunks.length}: ${chunk.length} chars (startIndex: ${startIndex}, endIndex: ${endIndex})`);
      }
      
      startIndex = endIndex;
    }
    
    // Send chunks with error handling for each chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        if (chunks[i].length > 0 && chunks[i].length <= 4096) {
          await bot.sendMessage(chatId, chunks[i], i === 0 ? options : {});
          console.log(`✅ Sent chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
          
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay for better reading
          }
        } else {
          console.log(`⚠️ Skipping invalid chunk ${i + 1}: length=${chunks[i].length}`);
        }
      } catch (chunkError) {
        console.error(`❌ Error sending chunk ${i + 1}:`, chunkError.message);
        // Try sending a fallback message instead
        try {
          await bot.sendMessage(chatId, `📚 មាតិកាមួយផ្នែក... ជំនួយ: @Chendasum`);
        } catch (fallbackError) {
          console.error("Fallback message failed:", fallbackError.message);
        }
      }
    }
    
    console.log(`🎉 Successfully processed all ${chunks.length} chunks`);
  } catch (error) {
    console.error("❌ Error in sendLongMessage:", error);
    // Final fallback - send short error message
    try {
      await bot.sendMessage(chatId, "❌ មានបញ្ហាក្នុងការផ្ញើសារ។ សូមទាក់ទង @Chendasum");
    } catch (finalError) {
      console.error("Final fallback failed:", finalError.message);
    }
  }
}

module.exports = { sendLongMessage };