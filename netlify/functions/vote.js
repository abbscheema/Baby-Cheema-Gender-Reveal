// netlify/functions/vote.js
//
// Stores each guesser's name + pink/blue call using Netlify Blobs
// (built into Netlify, no external service, no signup).
//
// GET  /.netlify/functions/vote
//      -> { pink: number, blue: number, entries: [{name, color, time}, ...] }
//
// POST /.netlify/functions/vote   { name, color }
//      -> records one guess, returns the updated summary above

import { getStore } from '@netlify/blobs';

export default async (req) => {
  const store = getStore('cheema-baby-reveal');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const entriesRaw = (await store.get('entries')) || '[]';
    let entries = JSON.parse(entriesRaw);

    if (req.method === 'GET') {
      return new Response(JSON.stringify(summarize(entries)), { headers });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const name = (body.name || '').toString().trim().slice(0, 60);
      const color = body.color;

      if (!name) {
        return new Response(JSON.stringify({ error: 'name is required' }), {
          status: 400,
          headers,
        });
      }
      if (color !== 'pink' && color !== 'blue') {
        return new Response(JSON.stringify({ error: 'invalid color' }), {
          status: 400,
          headers,
        });
      }

      entries.push({ name, color, time: new Date().toISOString() });
      await store.set('entries', JSON.stringify(entries));

      return new Response(JSON.stringify(summarize(entries)), { headers });
    }

    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
};

function summarize(entries) {
  const pink = entries.filter((e) => e.color === 'pink').length;
  const blue = entries.filter((e) => e.color === 'blue').length;
  return { pink, blue, entries };
}

export const config = {
  path: '/.netlify/functions/vote',
};
