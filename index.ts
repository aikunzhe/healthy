export default {
  async fetch(request: Request) {
    return new Response(HTML, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
      },
    });
  },
};
