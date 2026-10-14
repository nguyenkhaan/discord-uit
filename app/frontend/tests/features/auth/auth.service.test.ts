import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { publicClient } from "@/api/client";
import { login } from "@/features/auth/auth.service";

const credentials = {
  username: "student@uit.edu.vn",
  password: "correct-horse-battery-staple",
};

function mockPublicPost(response: unknown) {
  const originalPost = publicClient.post;
  const calls: unknown[][] = [];

  publicClient.post = (async (...arguments_: unknown[]) => {
    calls.push(arguments_);
    return { data: response };
  }) as unknown as typeof publicClient.post;

  return {
    calls,
    restore: () => {
      publicClient.post = originalPost;
    },
  };
}

describe("login", () => {
  it("posts credentials to the login endpoint and returns authentication tokens", async () => {
    const tokens = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };
    const post = mockPublicPost(tokens);

    try {
      assert.deepEqual(await login(credentials), tokens);
      assert.deepEqual(post.calls, [["/api/auth/login", credentials]]);
    } finally {
      post.restore();
    }
  });

  it("rejects a login response without both authentication tokens", async () => {
    const post = mockPublicPost({ accessToken: "access-token" });

    try {
      await assert.rejects(login(credentials), (error: Error) => {
        assert.equal(
          error.message,
          "Login response is missing authentication tokens.",
        );
        return true;
      });
    } finally {
      post.restore();
    }
  });
});
