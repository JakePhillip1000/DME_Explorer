import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import supabase from "../supabase_client.js";
import contacts from "../pages_backend/contacts_controller.js";
import adminContacts from "../pages_backend/admin_contact_controller.js";

const { data: users, error } = await supabase.from("register").select("id").limit(1);
assert.ifError(error);
assert.ok(users.length, "A registered user is required for this test.");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    req.session = {
        user: {
            id: users[0].id,
            username: "contact-test"
        }
    };

    next();
});

app.use("/api/contacts", contacts);

app.use(
    "/api/admin/contacts",
    (req, res, next) => {
        req.session.user.username = "admin";
        next();
    },
    adminContacts
);

const server = app.listen(0, "127.0.0.1");
await once(server, "listening");

const base = `http://127.0.0.1:${server.address().port}`;
let formId;

async function request(path, method = "GET", body, status = 200) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };

    if (body === undefined) {
        options.body = undefined;
    } else {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(base + path, options);
    const result = await response.json();

    assert.equal(response.status, status, `${method} ${path}: ${result.message}`);
    assert.equal(result.success, true);

    return result;
}

try {
    const submitted = await request("/api/contacts", "POST", {
        firstName: "Testing",
        lastName: "Test",
        email: "tester@gmail.com",
        topics: "Testing the function",
        message_about: "This is the automated testing"
    }, 201);

    formId = submitted.contact.form_id ?? submitted.contact.forms_id;

    assert.ok(formId);
    assert.equal(submitted.contact.form_id, formId);

    console.log("PASS: contact submission (201), UUID ownership and form_id response");

    const before = await request("/api/contacts/responses/unread-count");
    const listing = await request("/api/admin/contacts");

    assert.ok(listing.contacts.some(form => form.form_id === formId));

    const reply = await request(`/api/admin/contacts/${formId}/reply`, "PATCH", {
        response: "Automated test reply."
    });

    assert.equal(reply.contact.form_id, formId);
    assert.equal(reply.contact.response_status, "answered");

    const unread = await request("/api/contacts/responses/unread-count");
    assert.equal(unread.count, before.count + 1);

    const responses = await request("/api/contacts/responses");
    assert.ok(responses.responses.some(form => form.form_id === formId));

    await request(`/api/contacts/responses/${formId}/read`, "PATCH");

    const read = await request("/api/contacts/responses/unread-count");
    assert.equal(read.count, before.count);

    console.log("Admin reply success");

    const deleted = await request("/api/admin/contacts", "DELETE", {
        formIds: [formId]
    });

    assert.ok(deleted.deletedIds.includes(formId));

    console.log("Test pass, can delete the data");
} 

finally {
    if (formId) {
        const cleanup = await supabase
            .from("contact_forms")
            .delete()
            .eq("forms_id", formId);

        if (cleanup.error) {
            console.error("Test failed... cannot clean up data", cleanup.error.message);
            process.exitCode = 1;
        }
    }

    await new Promise(resolve => server.close(resolve));
}
