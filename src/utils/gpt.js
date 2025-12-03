const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeStatus(url, logicPrompt) {
  try {
    // URL에서 데이터 가져오기 (실제 구현 필요)
    const urlData = await fetch(url).then(res => res.text()).catch(() => null);
    
    if (!urlData) {
      return { status: 'error', message: 'Failed to fetch URL' };
    }

    const prompt = `${logicPrompt}\n\nURL 데이터:\n${urlData.substring(0, 2000)}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a status analyzer. Analyze the provided data and return a status.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
    });

    const result = completion.choices[0]?.message?.content || 'unknown';
    return { status: result.trim().toLowerCase(), raw: result };
  } catch (error) {
    console.error('GPT API Error:', error);
    return { status: 'error', message: error.message };
  }
}

module.exports = { analyzeStatus };

