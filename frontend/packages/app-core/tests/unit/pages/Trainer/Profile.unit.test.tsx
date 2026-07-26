import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Profile from "@/pages/Trainer/Profile";

const mocks = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  sendRequest: vi.fn(),
  acceptRequest: vi.fn(),
  deleteRequest: vi.fn(),
  removeFriend: vi.fn(),
  blockTrainer: vi.fn(),
  updateProfile: vi.fn(),
  updateUserDetails: vi.fn(),
}));

vi.mock("@/services/socialService", () => ({
  fetchTrainerProfile: mocks.fetchProfile,
  sendFriendRequest: mocks.sendRequest,
  acceptFriendRequest: mocks.acceptRequest,
  deleteFriendRequest: mocks.deleteRequest,
  removeFriend: mocks.removeFriend,
  blockTrainer: mocks.blockTrainer,
  updateTrainerProfile: mocks.updateProfile,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ updateUserDetails: mocks.updateUserDetails }),
}));

vi.mock("@/contexts/ModalContext", () => ({
  useModal: () => ({ confirm: vi.fn().mockResolvedValue(true) }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (
    selector: (state: {
      user: {
        user_id: string;
        username: string;
        pokemonGoName: string;
        trainerCode: string;
        location: string;
      };
    }) => unknown,
  ) =>
    selector({
      user: {
        user_id: "user-adam",
        username: "Adam",
        pokemonGoName: "Adam",
        trainerCode: "",
        location: "",
      },
    }),
}));

vi.mock("@/features/variants/store/useVariantsStore", () => ({
  useVariantsStore: (
    selector: (state: {
      variants: Array<{
        variant_id: string;
        species_name: string;
      }>;
    }) => unknown,
  ) =>
    selector({
      variants: [{ variant_id: "v-lucario", species_name: "Lucario" }],
    }),
}));

vi.mock("@/features/instances/store/useInstancesStore", () => ({
  useInstancesStore: (
    selector: (state: {
      instances: Record<string, Record<string, unknown>>;
    }) => unknown,
  ) =>
    selector({
      instances: {
        lucario: {
          instance_id: "instance-lucario",
          variant_id: "v-lucario",
          pokemon_id: 448,
          nickname: null,
          cp: 2498,
          is_caught: true,
          disabled: false,
        },
        wanted: {
          instance_id: "instance-wanted",
          variant_id: "v-wanted",
          pokemon_id: 150,
          nickname: null,
          cp: null,
          is_caught: false,
          disabled: false,
        },
      },
    }),
}));

const profile = {
  user: {
    user_id: "user-misty",
    username: "Misty",
    pokemonGoName: "CeruleanLeader",
    team: "Mystic",
    trainer_level: 50,
    app_joined_at: "2026-01-01T00:00:00Z",
  },
  bio: "Water-type trainer",
  stats: {
    caught: 12,
    for_trade: 3,
    wanted: 4,
    favorites: 5,
    registered: 10,
  },
  highlights: [],
  viewer: {
    relationship: "none",
    can_view_profile: true,
    can_view_collection: true,
  },
} as const;

describe("Trainer Profile", () => {
  beforeEach(() => {
    mocks.fetchProfile.mockResolvedValue(profile);
    mocks.sendRequest.mockResolvedValue({ friendship_id: "friend-1" });
  });

  it("shows the public trainer card and links to the trainer collection", async () => {
    render(
      <MemoryRouter initialEntries={["/profile/misty"]}>
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
          <Route
            path="/pokemon/:username"
            element={<div>Public collection</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("CeruleanLeader")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view pokemon/i }));
    expect(screen.getByText("Public collection")).toBeInTheDocument();
  });

  it("sends a friend request from a public profile action", async () => {
    render(
      <MemoryRouter initialEntries={["/profile/misty"]}>
        <Routes>
          <Route path="/profile/:username" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /add friend/i }));
    await waitFor(() =>
      expect(mocks.sendRequest).toHaveBeenCalledWith("Misty"),
    );
  });

  it("saves caught Pokemon selected for the owner showcase", async () => {
    const ownProfile = {
      ...profile,
      user: {
        ...profile.user,
        user_id: "user-adam",
        username: "Adam",
        pokemonGoName: "Adam",
      },
      viewer: {
        relationship: "self",
        can_view_profile: true,
        can_view_collection: true,
      },
    };
    mocks.fetchProfile.mockResolvedValue(ownProfile);
    mocks.updateProfile.mockResolvedValue({ success: true });
    mocks.updateUserDetails.mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /^edit$/i }));
    fireEvent.change(screen.getByLabelText(/showcase slot 1/i), {
      target: { value: "instance-lucario" },
    });
    expect(
      screen.queryByRole("option", { name: /mewtwo/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          highlight_instance_ids: ["instance-lucario"],
        }),
      ),
    );
  });
});
