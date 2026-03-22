import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post(
    'https://generativelanguage.googleapis.com/v1beta/models/:model:generateContent',
    () => {
      return HttpResponse.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Mock Gemini response',
                },
              ],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
      });
    },
  ),
];
