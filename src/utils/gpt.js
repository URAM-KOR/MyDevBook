const OpenAI = require('openai');
const logger = require('./logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeStatus(url, logicPrompt) {
  logger.logApi('OpenAI GPT', { url, promptLength: logicPrompt.length });
  try {
    // URL에서 데이터 가져오기 (실제 구현 필요)
    const urlData = await fetch(url).then(res => res.text()).catch(() => null);
    
    if (!urlData) {
      return { status: 'error', message: 'Failed to fetch URL' };
    }

    const prompt = `${logicPrompt}\n\nURL 데이터:\n${urlData.substring(0, 2000)}`;

    const model = process.env.OPENAI_MODEL || 'o1-preview';
    const completionParams = {
      model: model,
      messages: [
        { role: 'system', content: 'You are a status analyzer. Analyze the provided data and return a status.' },
        { role: 'user', content: prompt }
      ],
    };

    // o1, gpt-5 모델은 max_completion_tokens 사용, 다른 모델은 max_tokens 사용
    if (model.startsWith('o1') || model.startsWith('gpt-5')) {
      completionParams.max_completion_tokens = 200;
    } else {
      completionParams.max_tokens = 200;
    }

    const completion = await openai.chat.completions.create(completionParams);

    const result = completion.choices[0]?.message?.content || 'unknown';
    logger.info('GPT analysis completed', { url, status: result.trim().toLowerCase() });
    return { status: result.trim().toLowerCase(), raw: result };
  } catch (error) {
    logger.logError(error, { api: 'OpenAI GPT', url });
    return { status: 'error', message: error.message };
  }
}

module.exports = { analyzeStatus };

