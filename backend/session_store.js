import session from "express-session";
import supabase from "./supabase_client.js";

export class SupabaseSessionStore extends session.Store {
    get(id, callback) {
        supabase.from("app_sessions").select("data, expires_at").eq("id", id).maybeSingle()
            .then(({data, error}) => {
                if (error) return callback(error);
                if (!data || Date.parse(data.expires_at) <= Date.now()) return callback(null, null);
                callback(null, data.data);
            }, callback);
    }

    set(id, data, callback = () => {}) {
        const expires = data.cookie?.expires || new Date(Date.now() + 3600000).toISOString();
        supabase.from("app_sessions").upsert({id, data, expires_at: expires})
            .then(({error}) => callback(error), callback);
    }

    destroy(id, callback = () => {}) {
        supabase.from("app_sessions").delete().eq("id", id)
            .then(({error}) => callback(error), callback);
    }

    touch(id, data, callback) {
        this.set(id, data, callback);
    }
}
