import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Profile from "@/pages/Trainer/Profile";

const mocks = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  fetchOwnProfile: vi.fn(),
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
  fetchOwnTrainerProfile: mocks.fetchOwnProfile,
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
        variantType: "default";
        currentImage: string;
        image_url: string;
      }>;
    }) => unknown,
  ) =>
    selector({
      variants: [
        {
          variant_id: "v-lucario",
          species_name: "Lucario",
          variantType: "default",
          currentImage: "/images/pokemon/lucario.png",
          image_url: "/images/pokemon/lucario.png",
        },
      ],
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
    total_xp: 88_000_000,
    pogo_started_on: "2016-07-06T00:00:00Z",
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
    mocks.fetchOwnProfile.mockResolvedValue(profile);
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
    expect(
      screen.getByRole("region", { name: /misty's trainer card/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("88,000,000 XP")).toBeInTheDocument();
    expect(screen.getByText("Jul 6, 2016")).toBeInTheDocument();
    expect(
      screen.getAllByLabelText(/empty featured pokemon slot/i),
    ).toHaveLength(6);
    expect(screen.getByLabelText(/collection summary/i)).toBeInTheDocument();
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
    mocks.fetchOwnProfile.mockResolvedValue(ownProfile);
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
    const card = screen.getByRole("region", {
      name: /adam's trainer card/i,
    });
    expect(within(card).getByLabelText(/pokemon go name/i)).toHaveValue("Adam");
    expect(
      within(card).getByRole("heading", { name: /featured pokemon/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /edit profile/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(card).getByRole("button", {
        name: /select lucario for trainer card/i,
      }),
    );
    expect(
      within(card).getByRole("button", {
        name: /remove lucario from trainer card/i,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(card).getByLabelText(/1 of 6 pokemon selected/i),
    ).toBeInTheDocument();
    fireEvent.click(
      within(card).getByRole("button", { name: /save profile/i }),
    );

    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          highlight_instance_ids: ["instance-lucario"],
        }),
      ),
    );
  });

  it("offers profile setup when the signed-in trainer has never customized it", async () => {
    mocks.fetchOwnProfile.mockResolvedValue({
      ...profile,
      user: {
        user_id: "user-adam",
        username: "Adam",
        app_joined_at: "2026-01-01T00:00:00Z",
      },
      bio: null,
      location: null,
      trainer_code: null,
      stats: {
        caught: 0,
        for_trade: 0,
        wanted: 0,
        favorites: 0,
        registered: 0,
      },
      highlights: [],
      preferences: {
        user_id: "user-adam",
        profile_visibility: "public",
        collection_visibility: "public",
        friend_request_permission: "everyone",
        trainer_code_visibility: "friends",
        show_location: false,
        show_pokemon_go_name: true,
      },
      viewer: {
        relationship: "self",
        can_view_profile: true,
        can_view_collection: true,
      },
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /make this trainer profile yours/i,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /customize profile/i }));
    const card = screen.getByRole("region", {
      name: /adam's trainer card/i,
    });
    expect(within(card).getByLabelText(/pokemon go name/i)).toBeInTheDocument();
    expect(
      within(card).getByLabelText("Trainer level", { exact: true }),
    ).toBeInTheDocument();
    expect(within(card).getByLabelText(/trainer notes/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /edit profile/i }),
    ).not.toBeInTheDocument();
    expect(mocks.fetchProfile).not.toHaveBeenCalled();
  });

  it("cancels inline edits and restores the saved trainer card", async () => {
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
    mocks.fetchOwnProfile.mockResolvedValue(ownProfile);

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /^edit$/i }));
    const card = screen.getByRole("region", {
      name: /adam's trainer card/i,
    });
    fireEvent.change(within(card).getByLabelText(/pokemon go name/i), {
      target: { value: "Unsaved name" },
    });
    expect(within(card).getByLabelText(/pokemon go name/i)).toHaveValue(
      "Unsaved name",
    );

    fireEvent.click(within(card).getByRole("button", { name: /cancel/i }));

    expect(
      within(card).queryByLabelText(/pokemon go name/i),
    ).not.toBeInTheDocument();
    expect(within(card).getByRole("heading", { name: "Adam" })).toBeVisible();
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });
});
