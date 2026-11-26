// The only file that talks to the LLM provider.
// The provider, the model and the key come from .env:
//   process.env.LLM_BASE_URL, process.env.LLM_MODEL, process.env.LLM_API_KEY

// TODO P4: make a constant SYSTEM here: the rules for every answer (tone, length, format).
//          Then send it as the first message, before the user's message, in ask().
const SYSTEM = `~요로 끝나는 존댓말로 답해. 길이는 한 문단, 세문장 이내로 답해. 목록, 제목, 굵은 글씨같은 마크다운(**, -, ### 등)을 사용하지 마.`;
const SYSTEM_JSON = `JSON으로만 답한다. 키는 정확히 sentiment, score, summary 세개. sentiment는 positive, negative, neutral 중 하나로 답하고, score는 1 ~ 5 사이의 정수, summary는 한 문장 요약.`;

// ask("a question")  ->  the model's answer, as a string
export async function ask(question) {
  // TODO P3: write this function (see problems/P3_ask.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: question }],
    }),
    
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`LLM: HTTP ${res.status}`);
  return data.choices[0].message.content.trim();
}

// chat([{ role: "user", content: "..." }, { role: "assistant", content: "..." }, ...])
//   ->  the model's next answer, as a string
export async function chat(history) {
  // TODO P5: write this function (see problems/P5_chat.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        ...history],
    }),
    
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`LLM: HTTP ${res.status}`);
  return data.choices[0].message.content.trim();
}

// analyze("a review")  ->  an object, not a sentence:
//   { sentiment: "positive" | "negative" | "neutral", score: 1..5, summary: "one short sentence" }
export async function analyze(text) {
  // TODO P6: write this function (see problems/P6_json.md). Delete the throw line below.
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_JSON },
        { role: "user", content: text }],
      response_format: { type: "json_object" }
    }),
    
  });
  if (!res.ok) throw new Error(`LLM: HTTP ${res.status}`);
  const data = await res.json();
  const response = JSON.parse(data.choices[0].message.content.trim());

  const sentiment = response.sentiment;
  const score = response.score;
  const summary = response.summary;

  if(!["positive", "negative", "neutral"].includes(sentiment)) throw new Error("LLM: the answer has the wrong shape");
  if(!(Number.isInteger(score) && score >= 1 && score <= 5)) throw new Error("LLM: the answer has the wrong shape");
  if(!(typeof summary === "string")) throw new Error("LLM: the answer has the wrong shape");

  return response;

}