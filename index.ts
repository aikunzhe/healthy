import HTML from './index.html';

export default {
  async fetch(request, env) {
    return new Response(HTML, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
};
