import { json } from "@remix-run/node";
import { searchSN } from "../../db.server.js";

export async function action ({ request }) {
    let sign;
    try {
        const params = new URL(request.url).searchParams;
        const query = params.get("consulta");
        if (query?.length > 0) {
            sign = await searchSN(query, 1);
            sign.forEach(s => { s.heading = markdown(s.definitions[0]?.content || s.gloss); });
        } else {
            sign = [];
        }
    } catch (e) {
        console.error(e);
        sign = [];
    }
    return json({ sign });
}