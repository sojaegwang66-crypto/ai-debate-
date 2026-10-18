export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-App-Password",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST requests allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const appPassword = request.headers.get("X-App-Password");
    if (!appPassword || appPassword !== env.APP_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const { model, prompt } = await request.json();
      let responseText = "";

      if (model === "gemini") {
        if (!env.GEMINI_API_KEY) {
          responseText = "Gemini API 키가 설정되지 않았습니다.";
        } else {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const data = await res.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini 응답 오류";
        }
      } else {
        responseText = `${model} 모델은 현재 무료 크레딧이 없어 모의 응답으로 대체됩니다.`;
      }

      return new Response(JSON.stringify({ result: responseText }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }
};
