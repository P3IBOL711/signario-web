import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { useRef, useState, useEffect } from "react";

import { searchSN, searchSpa } from "../../db.server.js"; 
import { Search } from '../../components/search.jsx';
import markdown from "../../markdown.server.js";

const INITIAL_RESULTS = 6;
const MAX_RESULTS = 20;

export async function loader ({ request }) {
    let signs;
    try {
        const params = new URL(request.url).searchParams;
        const method = params.get("buscador");
        const query = params.get("consulta");
        if (query?.length > 0) {
            const limit = params.get("more")?MAX_RESULTS:(INITIAL_RESULTS+1);
            if (method == "traduccion") {
                signs = await searchSpa(query, limit);
            } else {
                signs = await searchSN(query, limit);
            }
            signs.forEach(s => { s.heading = markdown(s.definitions[0]?.content || s.gloss); });
        } else {
            signs = [];
        }
    } catch (e) {
        console.error(e);
        signs = [];
    }
    return json({ signs });
}


export default function ResultList () {
    const data = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();
    const more = searchParams.has("more");
    const signs = more?data.signs:data.signs.slice(0, INITIAL_RESULTS);
    const searchMode = searchParams.has("traduccion")?"traduccion":"parametros";
    const searched = searchParams.get("consulta")?.length > 0;
    return <div className={`${searched?'':'w-0 ml-0'} overflow-hidden transition-all`}>
        {searched && signs.length == 0?
            <p className="text-center text-lg text-stone-500 my-8 italic">No se han encontrado resultados</p>:
            <ul className="my-3">
                {signs.map(s => <li key={s.number}
                    className="border-b last:border-none border-stone-200 py-2 px-2">
                    <Snippet sign={s} />
                </li>)}
            </ul>
        }
        {data.signs.length>INITIAL_RESULTS && !more ? <a
            onClick={() => setSearchParams(p => { p.set('more', true); return p; })}
            className="text-orange-700 block pr-2 text-right cursor-pointer hover:underline"
            >ver más</a> : null}
    </div>;
}

function Snippet ({ sign }) {
    const vid = useRef(null);
    const [searchParams] = useSearchParams();
    const open = () => vid.current?.play();
    const close = () => {vid.current?.pause();vid.current?.fastSeek(0);};
    const touch = e => {
        if (document.activeElement!=e.currentTarget) {
            e.currentTarget.focus();
            e.preventDefault();
        }
    };
    const [firstMount, setFirstMount] = useState(true);
    useEffect(() => {
        setFirstMount(false);
    }, [firstMount]);
    return <Link to={`/signario/signo/${sign.number}`} prefetch="none"
        state={{buscador:searchParams.get("buscador"), consulta:searchParams.get("consulta")}}
        onMouseOver={open} onMouseOut={close} onFocus={open} onBlur={close} onTouchEnd={touch}
        className={(firstMount?"!max-h-0 ":"")+"block clear-both max-h-[4em] transition-all hover:max-h-[6em] focus:max-h-[6em] outline-none overflow-hidden"}>
        <video className="w-[200px] float-right -mt-4" muted loop ref={vid}>
            <source src={`/signario/signo/${sign.number}/video.mp4`} />
        </video>
        <span className="font-bold text-orange-700 mb-1">{sign.notation}</span>
        <span className="pl-3 text-stone-900"
            dangerouslySetInnerHTML={{__html: sign.heading}} />
    </Link>;
}
