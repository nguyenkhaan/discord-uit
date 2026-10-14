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
  it("posts credentials to the login endpoint without retaining authentication tokens", async () => {
    const tokens = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };
    const post = mockPublicPost(tokens);

    try {
      assert.equal(await login(credentials), undefined);
      assert.deepEqual(post.calls, [["/api/auth/login", credentials]]);
    } finally {
      post.restore();
    }
  });

  it("does not depend on tokens in the response body", async () => {
    const post = mockPublicPost({ accessToken: "access-token" });

    try {
      assert.equal(await login(credentials), undefined);
    } finally {
      post.restore();
    }
  });
});
