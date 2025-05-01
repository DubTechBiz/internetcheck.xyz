// _worker.js (required dummy file for wrangler v3+)
export default {
  async fetch(req) {
    return new Response("This should never run.", { status: 500 })
  }
}
