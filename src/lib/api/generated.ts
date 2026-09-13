export interface paths {
    "/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Liveness */
        get: operations["liveness_health_live_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Readiness
         * @description Report dependency readiness.
         *
         *     The status code is the signal and the body shape is identical at 200 and at
         *     503, which is what lets a client read "not ready" as a state rather than as a
         *     transport failure. Setting ``response.status_code`` is how that is expressed
         *     without hand-building a response body.
         */
        get: operations["readiness_health_ready_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Register
         * @description Create an account and its first shop, then sign in.
         */
        post: operations["register_api_v1_auth_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login */
        post: operations["login_api_v1_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refresh
         * @description Rotate the refresh cookie and issue a new access token.
         */
        post: operations["refresh_api_v1_auth_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Logout
         * @description End the session. Always 204: a client leaving has nothing to learn.
         */
        post: operations["logout_api_v1_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/switch-shop": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Switch Shop */
        post: operations["switch_shop_api_v1_auth_switch_shop_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Me */
        get: operations["me_api_v1_auth_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update Profile
         * @description Update only the supplied keys, so an omitted field is left alone.
         */
        patch: operations["update_profile_api_v1_auth_me_patch"];
        trace?: never;
    };
    "/api/v1/auth/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Deactivate
         * @description Retire the account, confirmed by its password. One-way.
         */
        post: operations["deactivate_api_v1_auth_deactivate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Upload Avatar
         * @description Replace the caller's avatar.
         *
         *     The previous object is left in place rather than deleted: its key is content
         *     addressed, so a client showing the old URL keeps working until it refetches, and
         *     the digest key means a revert to a previous image is free.
         */
        post: operations["upload_avatar_api_v1_auth_me_avatar_post"];
        /**
         * Delete Avatar
         * @description Remove the caller's avatar. Idempotent: a second call is also 204.
         */
        delete: operations["delete_avatar_api_v1_auth_me_avatar_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/shops/active/background": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload Background */
        post: operations["upload_background_api_v1_shops_active_background_post"];
        /** Delete Background */
        delete: operations["delete_background_api_v1_shops_active_background_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/shops/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete Active Shop
         * @description Retire the shop. Confirmed by its own name, read from the database.
         */
        delete: operations["delete_active_shop_api_v1_shops_active_delete"];
        options?: never;
        head?: never;
        /**
         * Update Active Shop
         * @description Update the active shop's profile. The slug is not part of the contract.
         */
        patch: operations["update_active_shop_api_v1_shops_active_patch"];
        trace?: never;
    };
    "/api/v1/media/avatar/{user_id}.webp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Serve Avatar
         * @description Serve an account's avatar.
         *
         *     The stored key is read from the database rather than reconstructed from the
         *     request, so a client cannot ask for an object the account does not own, and a
         *     deleted avatar is a 404 rather than a stale hit.
         */
        get: operations["serve_avatar_api_v1_media_avatar__user_id__webp_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/media/shop-background/{shop_id}.webp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Serve Shop Background */
        get: operations["serve_shop_background_api_v1_media_shop_background__shop_id__webp_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Body_upload_avatar_api_v1_auth_me_avatar_post */
        Body_upload_avatar_api_v1_auth_me_avatar_post: {
            /** File */
            file: string;
        };
        /** Body_upload_background_api_v1_shops_active_background_post */
        Body_upload_background_api_v1_shops_active_background_post: {
            /** File */
            file: string;
        };
        /**
         * DeactivateRequest
         * @description Deactivating is one-way, so it is confirmed with the password.
         */
        DeactivateRequest: {
            /** Password */
            password: string;
        };
        /**
         * DeleteShopRequest
         * @description Deleting a shop is one-way, so the shop's own name must be typed.
         */
        DeleteShopRequest: {
            /** Confirm Shop Name */
            confirm_shop_name: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** LivenessEnvelope */
        LivenessEnvelope: {
            data: components["schemas"]["LivenessResponse"];
        };
        /** LivenessResponse */
        LivenessResponse: {
            /**
             * Status
             * @constant
             */
            status: "ok";
            /** Service */
            service: string;
        };
        /**
         * LoginRequest
         * @description Sign in.
         *
         *     ``password`` is deliberately not length-validated beyond the request bound: a
         *     wrong password must reach the comparison and fail identically whether it is
         *     short or long, or the response would disclose the stored password's length.
         */
        LoginRequest: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
        };
        /**
         * MeData
         * @description The caller's own identity and the shop the token is scoped to.
         */
        MeData: {
            user: components["schemas"]["UserData"];
            active_shop: components["schemas"]["ShopData"];
            /** Memberships */
            memberships: components["schemas"]["MembershipData"][];
            /** Permissions */
            permissions: string[];
        };
        /** MeEnvelope */
        MeEnvelope: {
            data: components["schemas"]["MeData"];
        };
        /**
         * MembershipData
         * @description One shop the account belongs to, with the role it holds there.
         */
        MembershipData: {
            shop: components["schemas"]["ShopData"];
            role: components["schemas"]["RoleData"];
        };
        /**
         * ProfileUpdateRequest
         * @description A partial update of the caller's own profile.
         *
         *     An omitted key is unchanged; an explicit ``null`` clears a nullable field.
         *     ``full_name`` may not be cleared, because it is not nullable in the database.
         */
        ProfileUpdateRequest: {
            /** Full Name */
            full_name?: string | null;
            /** Bio */
            bio?: string | null;
            /** Phone */
            phone?: string | null;
            /** Job Title */
            job_title?: string | null;
        };
        /** ReadinessEnvelope */
        ReadinessEnvelope: {
            data: components["schemas"]["ReadinessResponse"];
        };
        /** ReadinessResponse */
        ReadinessResponse: {
            /**
             * Status
             * @enum {string}
             */
            status: "ok" | "not_ready";
            /** Dependencies */
            dependencies: {
                [key: string]: "ok" | "unavailable";
            };
        };
        /**
         * RegisterRequest
         * @description Create an account and its first shop in one call.
         */
        RegisterRequest: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
            /** Full Name */
            full_name: string;
            /** Shop Name */
            shop_name: string;
        };
        /** RoleData */
        RoleData: {
            /** Key */
            key: string;
            /** Name */
            name: string;
        };
        /**
         * SessionData
         * @description A successful sign-in.
         *
         *     The refresh token is *not* here. It travels only as an httpOnly cookie, so it
         *     never appears in a response body, a log, or a client's memory.
         */
        SessionData: {
            /** Access Token */
            access_token: string;
            /**
             * Token Type
             * @constant
             */
            token_type: "bearer";
            /** Expires In */
            expires_in: number;
            user: components["schemas"]["UserData"];
            active_shop: components["schemas"]["ShopData"];
            /** Memberships */
            memberships: components["schemas"]["MembershipData"][];
            /** Permissions */
            permissions: string[];
        };
        /** SessionEnvelope */
        SessionEnvelope: {
            data: components["schemas"]["SessionData"];
        };
        /**
         * ShopData
         * @description A shop as the seller CMS sees it.
         */
        ShopData: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /** Slug */
            slug: string;
            /** Description */
            description?: string | null;
            /** Contact Email */
            contact_email?: string | null;
            /** Contact Phone */
            contact_phone?: string | null;
            /** Website */
            website?: string | null;
            /** Background Url */
            background_url?: string | null;
        };
        /** ShopEnvelope */
        ShopEnvelope: {
            data: components["schemas"]["ShopData"];
        };
        /**
         * ShopUpdateRequest
         * @description A partial update of the active shop.
         *
         *     ``slug`` is absent on purpose: it is derived once at creation and a rename must
         *     not silently rewrite a public URL.
         */
        ShopUpdateRequest: {
            /** Name */
            name?: string | null;
            /** Description */
            description?: string | null;
            /** Contact Email */
            contact_email?: string | null;
            /** Contact Phone */
            contact_phone?: string | null;
            /** Website */
            website?: string | null;
        };
        /** SwitchShopRequest */
        SwitchShopRequest: {
            /**
             * Shop Id
             * Format: uuid
             */
            shop_id: string;
        };
        /**
         * UserData
         * @description An account as the seller CMS sees it.
         */
        UserData: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Email */
            email: string;
            /** Full Name */
            full_name: string;
            /** Bio */
            bio?: string | null;
            /** Phone */
            phone?: string | null;
            /** Job Title */
            job_title?: string | null;
            /** Avatar Url */
            avatar_url?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Last Login At */
            last_login_at?: string | null;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    liveness_health_live_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LivenessEnvelope"];
                };
            };
        };
    };
    readiness_health_ready_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessEnvelope"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessEnvelope"];
                };
            };
        };
    };
    register_api_v1_auth_register_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionEnvelope"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    login_api_v1_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionEnvelope"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    refresh_api_v1_auth_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionEnvelope"];
                };
            };
        };
    };
    logout_api_v1_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    switch_shop_api_v1_auth_switch_shop_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SwitchShopRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionEnvelope"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    me_api_v1_auth_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeEnvelope"];
                };
            };
        };
    };
    update_profile_api_v1_auth_me_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfileUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeEnvelope"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    deactivate_api_v1_auth_deactivate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeactivateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_avatar_api_v1_auth_me_avatar_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_avatar_api_v1_auth_me_avatar_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeEnvelope"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_avatar_api_v1_auth_me_avatar_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    upload_background_api_v1_shops_active_background_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_background_api_v1_shops_active_background_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ShopEnvelope"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_background_api_v1_shops_active_background_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    delete_active_shop_api_v1_shops_active_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteShopRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_active_shop_api_v1_shops_active_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShopUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ShopEnvelope"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    serve_avatar_api_v1_media_avatar__user_id__webp_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    serve_shop_background_api_v1_media_shop_background__shop_id__webp_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                shop_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}

