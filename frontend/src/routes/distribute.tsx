import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import safeChestIcon from "../assets/chests/safe.png";
import groupChestIcon from "../assets/chests/group.png";
import chaosChestIcon from "../assets/chests/chaos.png";
import safeGiveSipsIcon from "../assets/cards/safe_give_sips.png";
import safeGiveShotIcon from "../assets/cards/safe_give_shot.png";
import safeYouAndRandomSipIcon from "../assets/cards/safe_you_and_random_sip.png";
import safeHouseEdgeIcon from "../assets/cards/safe_house_edge.png";
import safeSweetDealIcon from "../assets/cards/safe_sweet_deal.png";
import safeMarkedBulletIcon from "../assets/cards/safe_marked_bullet.png";
import safeCurrentBodyCountIcon from "../assets/cards/safe_current_body_count.png";
import safeStableHandsIcon from "../assets/cards/safe_stable_hands.png";
import safeBurnedSlotsIcon from "../assets/cards/safe_burned_slots.png";
import safeBlankCheckIcon from "../assets/cards/safe_blank_check.png";
import groupEveryoneSipIcon from "../assets/cards/group_everyone_sip.png";
import groupEveryoneElseSipIcon from "../assets/cards/group_everyone_else_sip.png";
import groupCheapSeatsIcon from "../assets/cards/group_cheap_seats.png";
import groupMainEventIcon from "../assets/cards/group_main_event.png";
import groupDoubleUndrunkSipsIcon from "../assets/cards/group_double_undrunk_sips.png";
import groupDoubleUndrunkShotsIcon from "../assets/cards/group_double_undrunk_shots.png";
import groupDoubleOrNothingIcon from "../assets/cards/group_double_or_nothing.png";
import groupHouseRoundIcon from "../assets/cards/group_house_round.png";
import groupSlotMachineIcon from "../assets/cards/group_slot_machine.png";
import groupBodyCountIcon from "../assets/cards/group_body_count.png";
import groupStableHandsIcon from "../assets/cards/group_stable_hands.png";
import groupBurnedSlotsIcon from "../assets/cards/group_burned_slots.png";
import groupOldHandsIcon from "../assets/cards/group_old_hands.png";
import groupEdgeNumberIcon from "../assets/cards/group_edge_number.png";
import groupNoRumbleResumeIcon from "../assets/cards/group_no_rumble_resume.png";
import chaosGiveSipsIcon from "../assets/cards/chaos_give_sips.png";
import chaosGiveShotsIcon from "../assets/cards/chaos_give_shots.png";
import chaosEveryoneSipIcon from "../assets/cards/chaos_everyone_sip.png";
import chaosEveryoneElseShotIcon from "../assets/cards/chaos_everyone_else_shot.png";
import chaosYouDrinkShotsIcon from "../assets/cards/chaos_you_drink_shots.png";
import chaosBlackoutTaxIcon from "../assets/cards/chaos_blackout_tax.png";
import chaosSkullCrusherIcon from "../assets/cards/chaos_skull_crusher.png";
import chaosLastCallIcon from "../assets/cards/chaos_last_call.png";
import chaosRussianRouletteIcon from "../assets/cards/chaos_russian_roulette.png";
import chaosBloodPriceIcon from "../assets/cards/chaos_blood_price.png";
import chaosOpenTabIcon from "../assets/cards/chaos_open_tab.png";
import chaosLegendsDueIcon from "../assets/cards/chaos_legends_due.png";
import chaosVeteranFloorIcon from "../assets/cards/chaos_veteran_floor.png";
import chaosEdgeNumberTaxIcon from "../assets/cards/chaos_edge_number_tax.png";
import chaosHighTreasonIcon from "../assets/cards/chaos_high_treason.png";
import chaosKatesWorstNightmareIcon from "../assets/cards/chaos_kates_worst_nightmare.png";
import chaosLoadedDiceIcon from "../assets/cards/chaos_loaded_dice.png";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiJson, participantIdHeaders } from "../api/fetcher";
import {
  getPendingChestChoices,
  getPendingDrinkPools,
  getRevealedChestRewards,
  PendingChestChoice,
  PendingDrinkPool,
} from "../drink_pools";
import {
  getCardDescription,
  getCardTitle,
  getChoiceOptionDescription,
  getChoiceOptionTitle,
  getResolvedChoiceOptionDescription,
} from "../chest_cards";
import { useLobbyContext } from "../contexts/lobby_context";
import { useNotificationContext } from "../contexts/notification_context";
import { useParticipantClaim } from "../contexts/participant_claim_context";
import { useLoadingAndErrorStateContext } from "../contexts/loading_and_error_states";
import { ChestChoiceOption, ChestReward, Lobby, Participant } from "../hooks/use_lobby";
import { useI18n } from "../i18n";

type Allocation = Record<number, { schluecke: number; shots: number }>;

type ChestCardKey =
  | "safe_give_sips"
  | "safe_give_shot"
  | "safe_you_and_random_sip"
  | "safe_house_edge"
  | "safe_sweet_deal"
  | "safe_marked_bullet"
  | "safe_current_body_count"
  | "safe_stable_hands"
  | "safe_burned_slots"
  | "safe_blank_check"
  | "group_everyone_sip"
  | "group_everyone_else_sip"
  | "group_cheap_seats"
  | "group_main_event"
  | "group_double_undrunk_sips"
  | "group_double_undrunk_shots"
  | "group_double_or_nothing"
  | "group_house_round"
  | "group_slot_machine"
  | "group_body_count"
  | "group_stable_hands"
  | "group_burned_slots"
  | "group_old_hands"
  | "group_edge_number"
  | "group_no_rumble_resume"
  | "chaos_give_sips"
  | "chaos_give_shots"
  | "chaos_everyone_sip"
  | "chaos_everyone_else_shot"
  | "chaos_you_drink_shots"
  | "chaos_blackout_tax"
  | "chaos_skull_crusher"
  | "chaos_last_call"
  | "chaos_russian_roulette"
  | "chaos_blood_price"
  | "chaos_open_tab"
  | "chaos_legends_due"
  | "chaos_veteran_floor"
  | "chaos_edge_number_tax"
  | "chaos_high_treason"
  | "chaos_kates_worst_nightmare"
  | "chaos_loaded_dice";

type RevealedChestResult = {
  chest_reward_id: number;
  chest_type: "safe" | "group" | "chaos";
  card_key: string;
  card_mode: "auto" | "give_out" | "target_pick" | "effect_choice";
  schluecke: number;
  shots: number;
  choice_options?: ChestChoiceOption[] | null;
  selected_choice_key?: string | null;
  offenderName: string;
  victimName: string;
  affectedParticipantIds?: number[] | null;
  chooserParticipantId?: number;
  adminMode?: boolean;
};

const cardIcons: Record<ChestCardKey, string> = {
  safe_give_sips: safeGiveSipsIcon,
  safe_give_shot: safeGiveShotIcon,
  safe_you_and_random_sip: safeYouAndRandomSipIcon,
  safe_house_edge: safeHouseEdgeIcon,
  safe_sweet_deal: safeSweetDealIcon,
  safe_marked_bullet: safeMarkedBulletIcon,
  safe_current_body_count: safeCurrentBodyCountIcon,
  safe_stable_hands: safeStableHandsIcon,
  safe_burned_slots: safeBurnedSlotsIcon,
  safe_blank_check: safeBlankCheckIcon,
  group_everyone_sip: groupEveryoneSipIcon,
  group_everyone_else_sip: groupEveryoneElseSipIcon,
  group_cheap_seats: groupCheapSeatsIcon,
  group_main_event: groupMainEventIcon,
  group_double_undrunk_sips: groupDoubleUndrunkSipsIcon,
  group_double_undrunk_shots: groupDoubleUndrunkShotsIcon,
  group_double_or_nothing: groupDoubleOrNothingIcon,
  group_house_round: groupHouseRoundIcon,
  group_slot_machine: groupSlotMachineIcon,
  group_body_count: groupBodyCountIcon,
  group_stable_hands: groupStableHandsIcon,
  group_burned_slots: groupBurnedSlotsIcon,
  group_old_hands: groupOldHandsIcon,
  group_edge_number: groupEdgeNumberIcon,
  group_no_rumble_resume: groupNoRumbleResumeIcon,
  chaos_give_sips: chaosGiveSipsIcon,
  chaos_give_shots: chaosGiveShotsIcon,
  chaos_everyone_sip: chaosEveryoneSipIcon,
  chaos_everyone_else_shot: chaosEveryoneElseShotIcon,
  chaos_you_drink_shots: chaosYouDrinkShotsIcon,
  chaos_blackout_tax: chaosBlackoutTaxIcon,
  chaos_skull_crusher: chaosSkullCrusherIcon,
  chaos_last_call: chaosLastCallIcon,
  chaos_russian_roulette: chaosRussianRouletteIcon,
  chaos_blood_price: chaosBloodPriceIcon,
  chaos_open_tab: chaosOpenTabIcon,
  chaos_legends_due: chaosLegendsDueIcon,
  chaos_veteran_floor: chaosVeteranFloorIcon,
  chaos_edge_number_tax: chaosEdgeNumberTaxIcon,
  chaos_high_treason: chaosHighTreasonIcon,
  chaos_kates_worst_nightmare: chaosKatesWorstNightmareIcon,
  chaos_loaded_dice: chaosLoadedDiceIcon,
};

function isChestCardKey(value: string): value is ChestCardKey {
  return value in cardIcons;
}

type EffectChoiceResolutionResult = {
  next_status: "pending_distribution" | "resolved";
  selected_choice_key: string;
  affected_participant_ids?: number[] | null;
  resolved_option?: ChestChoiceOption;
};

export function Distribute() {
  const { lobby, lobbyQuery } = useLobbyContext();
  const { claimedParticipantId } = useParticipantClaim();
  const { eliminationId } = useParams<{ eliminationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [didRefetch, setDidRefetch] = useState(false);
  const parsedEliminationId = eliminationId ? parseInt(eliminationId) : undefined;
  const adminChestRewardId = searchParams.get("adminChestRewardId");
  const adminParticipantId = searchParams.get("adminParticipantId");
  const chestChoices =
    lobby && claimedParticipantId !== null
      ? getPendingChestChoices(lobby, claimedParticipantId)
      : [];
  const revealedChestRewards =
    lobby && claimedParticipantId !== null
      ? getRevealedChestRewards(lobby, claimedParticipantId)
      : [];
  const pools =
    lobby && claimedParticipantId !== null
      ? getPendingDrinkPools(lobby, claimedParticipantId, parsedEliminationId)
      : [];
  const firstRevealedChestReward = revealedChestRewards[0] ?? null;
  const revealedChestResult = firstRevealedChestReward
    ? {
        chest_reward_id: firstRevealedChestReward.chestRewardId,
        chest_type: firstRevealedChestReward.chestType,
        card_key: firstRevealedChestReward.cardKey,
        card_mode: firstRevealedChestReward.cardMode,
        schluecke: firstRevealedChestReward.schluecke,
        shots: firstRevealedChestReward.shots,
        choice_options: firstRevealedChestReward.choiceOptions,
        selected_choice_key: firstRevealedChestReward.selectedChoiceKey,
        affectedParticipantIds: firstRevealedChestReward.affectedParticipantIds,
        offenderName:
          firstRevealedChestReward.offender?.wrestler.name ?? t("distribute.adminTriggerOffender"),
        victimName:
          firstRevealedChestReward.victim?.wrestler.name ?? t("distribute.adminTriggerVictim"),
      }
    : null;
  const adminRevealedChestResult =
    lobby && adminChestRewardId && adminParticipantId
      ? buildAdminRevealResult(lobby, Number(adminChestRewardId), Number(adminParticipantId))
      : null;
  const hasChestChoices = chestChoices.length > 0;
  const hasPools = pools.length > 0;

  useEffect(() => {
    if (
      !lobby ||
      claimedParticipantId === null ||
      hasChestChoices ||
      hasPools ||
      didRefetch ||
      !lobbyQuery
    ) {
      return;
    }
    setDidRefetch(true);
    lobbyQuery.refetch();
  }, [claimedParticipantId, didRefetch, hasChestChoices, hasPools, lobby, lobbyQuery]);

  if (!lobby || claimedParticipantId === null) return null;

  if (adminRevealedChestResult) {
    return (
      <ChestRevealScreen
        lobby={lobby}
        result={adminRevealedChestResult}
        onContinue={async () => {
          await acknowledgeChestReveal(
            lobby.code,
            adminRevealedChestResult.chest_reward_id,
            Number(adminParticipantId),
          );
          await lobbyQuery?.refetch();
          if (adminRevealedChestResult.card_mode === "target_pick") {
            navigate(
              `/lobbies/${lobby.code}/distribute?adminTargetChestRewardId=${adminChestRewardId}&adminParticipantId=${adminParticipantId}`,
            );
            return;
          }
          if (adminRevealedChestResult.card_mode === "effect_choice") {
            navigate(
              `/lobbies/${lobby.code}/distribute?adminEffectChoiceChestRewardId=${adminChestRewardId}&adminParticipantId=${adminParticipantId}`,
            );
            return;
          }
          if (adminRevealedChestResult.card_mode === "give_out") {
            navigate(
              `/lobbies/${lobby.code}/distribute?adminParticipantId=${adminParticipantId}`,
            );
            return;
          }
          navigate(`/lobbies/${lobby.code}/view-game`);
        }}
      />
    );
  }

  if (revealedChestResult) {
    return (
      <ChestRevealScreen
        lobby={lobby}
        result={revealedChestResult}
        onContinue={async () => {
          await acknowledgeChestReveal(
            lobby.code,
            revealedChestResult.chest_reward_id,
            claimedParticipantId,
          );
          await lobbyQuery?.refetch();
          if (revealedChestResult.card_mode === "target_pick") {
            return;
          }
          if (revealedChestResult.card_mode === "effect_choice") {
            return;
          }
          if (revealedChestResult.card_mode === "give_out") {
            return;
          }
          navigate(`/lobbies/${lobby.code}/view-game`);
        }}
      />
    );
  }

  if (hasChestChoices) {
    return (
      <ChestChoiceForm
        choice={chestChoices[0]}
        chooserId={claimedParticipantId}
        lobbyCode={lobby.code}
        onResolved={async () => {
          await lobbyQuery?.refetch();
        }}
      />
    );
  }

  const effectiveParticipantId =
    adminParticipantId === null ? claimedParticipantId : Number(adminParticipantId);
  const adminTargetChestRewardId = searchParams.get("adminTargetChestRewardId");
  const targetPickRewardId = adminTargetChestRewardId ?? null;
  const targetPickReward = targetPickRewardId
    ? lobby.chest_rewards.find(
        (reward) =>
          reward.id === Number(targetPickRewardId) &&
          reward.status === "pending_target_pick",
      )
    : lobby.chest_rewards.find(
        (reward) =>
          reward.chooser_participant_id === claimedParticipantId &&
          reward.status === "pending_target_pick",
      );

  if (targetPickReward) {
    return (
      <TargetPickScreen
        lobby={lobby}
        chestRewardId={targetPickReward.id}
        chooserParticipantId={targetPickReward.chooser_participant_id}
        actorParticipantId={targetPickReward.chooser_participant_id}
        onResolved={async () => {
          await lobbyQuery?.refetch();
          navigate(`/lobbies/${lobby.code}/view-game`);
        }}
      />
    );
  }

  const adminEffectChoiceChestRewardId = searchParams.get("adminEffectChoiceChestRewardId");
  const effectChoiceReward = adminEffectChoiceChestRewardId
    ? lobby.chest_rewards.find(
        (reward) =>
          reward.id === Number(adminEffectChoiceChestRewardId) &&
          reward.status === "pending_effect_choice",
      )
    : lobby.chest_rewards.find(
        (reward) =>
          reward.chooser_participant_id === claimedParticipantId &&
          reward.status === "pending_effect_choice",
      );

  if (effectChoiceReward) {
    return (
      <EffectChoiceScreen
        lobby={lobby}
        reward={effectChoiceReward}
        actorParticipantId={effectChoiceReward.chooser_participant_id}
        onResolved={async (result) => {
          await lobbyQuery?.refetch();
          if (result.next_status === "resolved") {
            navigate(`/lobbies/${lobby.code}/view-game`);
          }
        }}
      />
    );
  }

  const effectivePools =
    lobby && effectiveParticipantId !== null
      ? getPendingDrinkPools(lobby, effectiveParticipantId, parsedEliminationId)
      : pools;
  const constrainedPool = effectivePools.find(
    (pool) => (pool.minimumSelfSchluecke ?? 0) > 0 || (pool.minimumSelfShots ?? 0) > 0,
  );

  if (effectivePools.length === 0) {
    if (lobbyQuery?.isFetching) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography>{t("distribute.loading")}</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        <Typography>{t("distribute.none")}</Typography>
        <Button onClick={() => navigate(`/lobbies/${lobby.code}/view-game`)}>
          {t("common.back")}
        </Button>
      </Box>
    );
  }

  if (constrainedPool) {
    return (
      <AggregateForm
        lobby={lobby}
        pools={[constrainedPool]}
        giverId={effectiveParticipantId}
        onFinish={async () => {
          await lobbyQuery?.refetch();
          navigate(`/lobbies/${lobby.code}/distribute${window.location.search}`);
        }}
        onRecover={async () => { await lobbyQuery?.refetch(); }}
      />
    );
  }

  return (
    <AggregateForm
      lobby={lobby}
      pools={effectivePools}
      giverId={effectiveParticipantId}
      onFinish={() => navigate(`/lobbies/${lobby.code}/view-game`)}
      onRecover={async () => { await lobbyQuery?.refetch(); }}
    />
  );
}

function ChestChoiceForm({
  choice,
  chooserId,
  lobbyCode,
  onResolved,
}: {
  choice: PendingChestChoice;
  chooserId: number;
  lobbyCode: string;
  onResolved: () => Promise<void>;
}) {
  const { setIsLoading: setKeyLoading } = useLoadingAndErrorStateContext();
  const { notify } = useNotificationContext();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openChest = async (chestType: "safe" | "group" | "chaos") => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setKeyLoading("openChest", true);
    try {
      await postChestRoll(lobbyCode, choice.chestRewardId, chestType, chooserId);
      await onResolved();
    } catch (error) {
      notify((error as Error).message, "error");
    } finally {
      setIsSubmitting(false);
      setKeyLoading("openChest", false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ textAlign: "center", mb: 1 }}>
        {t("distribute.chestTitle", {
          offender: choice.offender?.wrestler.name ?? t("distribute.adminTriggerOffender"),
          victim: choice.victim?.wrestler.name ?? t("distribute.adminTriggerVictim"),
        })}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.8, mb: 3 }}>
        {t("distribute.chooseChest")}
      </Typography>
      <Stack spacing={2}>
        <ChestTypeCard
          title={t("distribute.chestSafe")}
          body={t("distribute.chestSafeHint")}
          imageSrc={safeChestIcon}
          onClick={() => openChest("safe")}
          disabled={isSubmitting}
        />
        <ChestTypeCard
          title={t("distribute.chestGroup")}
          body={t("distribute.chestGroupHint")}
          imageSrc={groupChestIcon}
          onClick={() => openChest("group")}
          disabled={isSubmitting}
        />
        <ChestTypeCard
          title={t("distribute.chestChaos")}
          body={t("distribute.chestChaosHint")}
          imageSrc={chaosChestIcon}
          onClick={() => openChest("chaos")}
          disabled={isSubmitting}
        />
      </Stack>
    </Box>
  );
}

function ChestRevealScreen({
  lobby,
  result,
  onContinue,
}: {
  lobby: Lobby;
  result: RevealedChestResult;
  onContinue: () => Promise<void>;
}) {
  const { setIsLoading: setKeyLoading } = useLoadingAndErrorStateContext();
  const { notify } = useNotificationContext();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const affectedParticipants = (result.affectedParticipantIds ?? [])
    .map((participantId) => lobby.participants.find((participant) => participant.id === participantId))
    .filter((participant): participant is Participant => Boolean(participant));

  const handleContinue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setKeyLoading("continueChest", true);
    try {
      await onContinue();
    } catch (error) {
      notify((error as Error).message, "error");
    } finally {
      setIsSubmitting(false);
      setKeyLoading("continueChest", false);
    }
  };

  return (
    <Box sx={{ p: 2, display: "grid", gap: 2 }}>
      <Typography variant="h6" sx={{ textAlign: "center" }}>
        {t("distribute.chestRevealTitle", {
          chest: t(`distribute.chest.${result.chest_type}`),
        })}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.8 }}>
        {t("distribute.chestTitle", {
          offender: result.offenderName,
          victim: result.victimName,
        })}
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: { xs: "center", sm: "center" },
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <CardIcon imageSrc={getCardIcon(result.card_key)} size={88} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>
                {t(`distribute.chest.${result.chest_type}`)}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mt: 1,
                  mb: 1,
                  fontSize: { xs: "1.8rem", sm: "2.125rem" },
                  lineHeight: 1.1,
                }}
              >
                {getCardTitle(t, result.card_key)}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {getCardDescription(t, {
                  card_key: result.card_key,
                  card_mode: result.card_mode,
                  pending_schluecke: result.schluecke,
                  pending_shots: result.shots,
                  choice_options: result.choice_options,
                  selected_choice_key: result.selected_choice_key,
                  affectedParticipantNames: affectedParticipants.map((participant) => participant.name),
                })}
              </Typography>
              {affectedParticipants.length > 0 && (
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                  {t("distribute.affectedPlayers", {
                    players: affectedParticipants.map((participant) => participant.name).join(", "),
                  })}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Button variant="contained" size="large" onClick={handleContinue} disabled={isSubmitting}>
        {result.card_mode === "target_pick"
          ? t("distribute.continueToTargetPick")
          : result.card_mode === "effect_choice"
          ? t("distribute.continueToEffectChoice")
          : result.card_mode === "give_out"
          ? t("distribute.continueToDistribution")
          : t("distribute.continueToGame")}
      </Button>
    </Box>
  );
}

function TargetPickScreen({
  lobby,
  chestRewardId,
  chooserParticipantId,
  actorParticipantId,
  onResolved,
}: {
  lobby: Lobby;
  chestRewardId: number;
  chooserParticipantId: number;
  actorParticipantId: number;
  onResolved: () => Promise<void>;
}) {
  const { setIsLoading: setKeyLoading } = useLoadingAndErrorStateContext();
  const { notify } = useNotificationContext();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chooser = lobby.participants.find((participant) => participant.id === chooserParticipantId);
  const options = lobby.participants.filter((participant) => participant.id !== chooserParticipantId);

  const pickTarget = async (targetParticipantId: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setKeyLoading("resolveRussianRoulette", true);
    try {
      const result = await postTargetResolution(
        lobby.code,
        chestRewardId,
        targetParticipantId,
        actorParticipantId,
      );
      const loser = lobby.participants.find(
        (participant) => participant.id === result.result_participant_id,
      );
      notify(
        t("distribute.russianRouletteResult", {
          loser: loser?.name ?? t("distribute.adminTriggerVictim"),
        }),
        "success",
      );
      await onResolved();
    } catch (error) {
      notify((error as Error).message, "error");
    } finally {
      setIsSubmitting(false);
      setKeyLoading("resolveRussianRoulette", false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ textAlign: "center", mb: 1 }}>
        {t("distribute.russianRouletteTitle")}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.8, mb: 3 }}>
        {t("distribute.russianRouletteBody", {
          chooser: chooser?.name ?? t("distribute.adminTriggerOffender"),
        })}
      </Typography>
      <Stack spacing={2}>
        {options.map((participant) => (
          <Card key={participant.id} variant="outlined">
            <CardActionArea onClick={() => pickTarget(participant.id)} disabled={isSubmitting}>
              <CardContent>
                <Typography variant="h6">{participant.name}</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

function EffectChoiceScreen({
  lobby,
  reward,
  actorParticipantId,
  onResolved,
}: {
  lobby: Lobby;
  reward: ChestReward;
  actorParticipantId: number;
  onResolved: (result: EffectChoiceResolutionResult) => Promise<void>;
}) {
  const { setIsLoading: setKeyLoading } = useLoadingAndErrorStateContext();
  const { notify } = useNotificationContext();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const options = reward.choice_options ?? [];

  const resolveChoice = async (option: ChestChoiceOption) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setKeyLoading(`resolveEffectChoice:${reward.id}`, true);
    try {
      const result = await postEffectChoice(lobby.code, reward.id, option.key, actorParticipantId);
      notify(
        t("distribute.effectChoiceResolved", {
          choice: getResolvedChoiceOptionDescription(
            t,
            reward.card_key ?? "",
            result.resolved_option
              ? { ...option, resolved_option: result.resolved_option }
              : option,
          ),
        }),
        "success",
      );
      await onResolved(result);
    } catch (error) {
      notify((error as Error).message, "error");
    } finally {
      setIsSubmitting(false);
      setKeyLoading(`resolveEffectChoice:${reward.id}`, false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ textAlign: "center", mb: 1 }}>
        {getCardTitle(t, reward.card_key ?? "")}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.8, mb: 3 }}>
        {t("distribute.effectChoiceBody")}
      </Typography>
      <Stack spacing={2}>
        {options.map((option) => (
          <Card key={option.key} variant="outlined">
            <CardActionArea onClick={() => resolveChoice(option)} disabled={isSubmitting}>
              <CardContent>
                <Typography variant="h6">
                  {getChoiceOptionTitle(t, reward.card_key ?? "", option)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  {getChoiceOptionDescription(t, reward.card_key ?? "", option)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

function ChestTypeCard({
  title,
  body,
  imageSrc,
  onClick,
  disabled = false,
}: {
  title: string;
  body: string;
  imageSrc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} disabled={disabled}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CardIcon imageSrc={imageSrc} size={72} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6">{title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {body}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function CardIcon({ imageSrc, size = 72 }: { imageSrc?: string; size?: number }) {
  if (!imageSrc) {
    return null;
  }

  return (
    <Box
      component="img"
      src={imageSrc}
      alt=""
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: "contain",
      }}
    />
  );
}

function AggregateForm({
  lobby,
  pools,
  giverId,
  onFinish,
  onRecover,
}: {
  lobby: Lobby;
  pools: PendingDrinkPool[];
  giverId: number;
  onFinish: () => void | Promise<void>;
  onRecover: () => Promise<void>;
}) {
  const { setIsLoading: setKeyLoading } = useLoadingAndErrorStateContext();
  const { notify } = useNotificationContext();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alloc, setAlloc] = useState<Allocation>(() =>
    Object.fromEntries(
      lobby.participants.map((p) => [p.id, { schluecke: 0, shots: 0 }]),
    ),
  );

  const totalSchluecke = pools.reduce((sum, pool) => sum + pool.schluecke, 0);
  const totalShots = pools.reduce((sum, pool) => sum + pool.shots, 0);
  const minimumSelfSchluecke = pools.reduce((sum, pool) => sum + (pool.minimumSelfSchluecke ?? 0), 0);
  const minimumSelfShots = pools.reduce((sum, pool) => sum + (pool.minimumSelfShots ?? 0), 0);
  const showSchluecke = totalSchluecke > 0;
  const showShots = totalShots > 0;
  const totalSummary = formatVisibleDrinkSummary(t, totalSchluecke, totalShots);
  const minimumSelfSummary = formatVisibleDrinkSummary(
    t,
    minimumSelfSchluecke,
    minimumSelfShots,
  );

  const sumSchluecke = useMemo(
    () => Object.values(alloc).reduce((s, a) => s + a.schluecke, 0),
    [alloc],
  );
  const sumShots = useMemo(
    () => Object.values(alloc).reduce((s, a) => s + a.shots, 0),
    [alloc],
  );

  const selfAllocation = alloc[giverId] ?? { schluecke: 0, shots: 0 };
  const meetsSelfMinimum =
    selfAllocation.schluecke >= minimumSelfSchluecke &&
    selfAllocation.shots >= minimumSelfShots;
  const canSubmit =
    sumSchluecke === totalSchluecke &&
    sumShots === totalShots &&
    meetsSelfMinimum;

  const bump = (
    participantId: number,
    key: "schluecke" | "shots",
    delta: number,
  ) => {
    if (isSubmitting) return;
    setAlloc((prev) => {
      const current = prev[participantId];
      const next = Math.max(0, current[key] + delta);
      return { ...prev, [participantId]: { ...current, [key]: next } };
    });
  };

  const submit = async () => {
    if (isSubmitting) return;
    const requests = buildDistributionRequests(pools, alloc);
    setIsSubmitting(true);
    setKeyLoading("distribute", true);
    try {
      for (const request of requests) {
        await postDistribution(lobby.code, request, giverId);
      }
      await onFinish();
    } catch (error) {
      notify(`${t("distribute.failedPrefix")}: ${(error as Error).message}`, "error");
      setAlloc(Object.fromEntries(
        lobby.participants.map((participant) => [participant.id, { schluecke: 0, shots: 0 }]),
      ));
      await onRecover();
    } finally {
      setIsSubmitting(false);
      setKeyLoading("distribute", false);
    }
  };

  return (
    <Box
      aria-busy={isSubmitting}
      sx={{
        p: 2,
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <Typography variant="h6" sx={{ textAlign: "center" }}>
        {t("distribute.aggregateTitle")}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.8, mb: 2 }}>
        {`${t("distribute.aggregateTotalLabel")}: ${totalSummary}`}
      </Typography>
      {(minimumSelfSchluecke > 0 || minimumSelfShots > 0) && (
        <Typography variant="body2" sx={{ textAlign: "center", opacity: 0.8, mb: 2 }}>
          {`${t("distribute.minimumSelfPrefix")} ${minimumSelfSummary}.`}
        </Typography>
      )}

      <Stack spacing={0.5} sx={{ mb: 2 }}>
        {pools.map((pool) => (
          <Typography
            key={`${pool.chestRewardId ?? 0}-${pool.eliminationId}-${pool.offender?.id ?? 0}-${pool.victim?.id ?? 0}`}
            variant="body2"
            sx={{ opacity: 0.8 }}
          >
            {t("distribute.aggregateElimination", {
              id: pool.eliminationId,
              offender: pool.offender?.wrestler.name ?? t("distribute.adminTriggerOffender"),
              victim: pool.victim?.wrestler.name ?? t("distribute.adminTriggerVictim"),
            })}
          </Typography>
        ))}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        {lobby.participants.map((p) => (
          <ParticipantRow
            key={p.id}
            participant={p}
            schluecke={alloc[p.id].schluecke}
            shots={alloc[p.id].shots}
            showSchluecke={showSchluecke}
            showShots={showShots}
            canIncSchluecke={sumSchluecke < totalSchluecke}
            canIncShots={sumShots < totalShots}
            disabled={isSubmitting}
            onBump={(key, delta) => bump(p.id, key, delta)}
          />
        ))}
      </Stack>

      <Box sx={{ mt: 3, textAlign: "center" }}>
        {showSchluecke && (
          <Typography variant="body2">
            {t("distribute.sips", { current: sumSchluecke, total: totalSchluecke })}
          </Typography>
        )}
        {showShots && (
          <Typography variant="body2">
            {t("distribute.shots", { current: sumShots, total: totalShots })}
          </Typography>
        )}
      </Box>

      <Stack spacing={1} sx={{ mt: 3 }}>
        <Button variant="contained" size="large" disabled={!canSubmit || isSubmitting} onClick={submit}>
          {t("common.confirm")}
        </Button>
        <Button size="small" onClick={onFinish} disabled={isSubmitting}>
          {t("distribute.skip")}
        </Button>
      </Stack>
    </Box>
  );
}

function buildAdminRevealResult(
  lobby: Lobby,
  chestRewardId: number,
  participantId: number,
): RevealedChestResult | null {
  const reward = lobby.chest_rewards.find(
    (entry) =>
      entry.id === chestRewardId &&
      entry.chooser_participant_id === participantId &&
      (
        entry.status === "revealed_effect_choice" ||
        entry.status === "revealed_auto" ||
        entry.status === "revealed_distribution" ||
        entry.status === "revealed_target_pick"
      ) &&
      entry.chest_type &&
      entry.card_key &&
      entry.card_mode,
  );

  if (!reward) {
    return null;
  }
  if (!reward.chest_type || !reward.card_key || !reward.card_mode) {
    return null;
  }

  const chooser = lobby.participants.find((participant) => participant.id === participantId);

  return {
    chest_reward_id: reward.id,
    chest_type: reward.chest_type,
    card_key: reward.card_key,
    card_mode: reward.card_mode,
    schluecke: reward.pending_schluecke,
    shots: reward.pending_shots,
    choice_options: reward.choice_options ?? null,
    selected_choice_key: reward.selected_choice_key ?? null,
    affectedParticipantIds: reward.affected_participant_ids ?? null,
    offenderName: chooser?.name ?? "Admin",
    victimName: "debug trigger",
    chooserParticipantId: participantId,
    adminMode: true,
  };
}

function buildDistributionRequests(pools: PendingDrinkPool[], alloc: Allocation) {
  const remaining = Object.fromEntries(
    Object.entries(alloc).map(([participantId, value]) => [participantId, { ...value }]),
  ) as Allocation;

  return pools
    .map((pool) => {
      let remainingSchluecke = pool.schluecke;
      let remainingShots = pool.shots;
      const splits: {
        receiver_participant_id: number;
        schluecke: number;
        shots: number;
      }[] = [];

      for (const participantIdString of Object.keys(remaining)) {
        const participantId = parseInt(participantIdString);
        const entry = remaining[participantId];
        const schluecke = Math.min(entry.schluecke, remainingSchluecke);
        const shots = Math.min(entry.shots, remainingShots);

        if (schluecke > 0 || shots > 0) {
          splits.push({
            receiver_participant_id: participantId,
            schluecke,
            shots,
          });
        }

        entry.schluecke -= schluecke;
        entry.shots -= shots;
        remainingSchluecke -= schluecke;
        remainingShots -= shots;
      }

      return {
        chest_reward_id: pool.chestRewardId,
        elimination_id: pool.eliminationId,
        offender_rumbler_id: pool.offender?.id ?? 0,
        victim_rumbler_id: pool.victim?.id ?? 0,
        splits,
      };
    })
    .filter((request) => request.splits.length > 0);
}

function ParticipantRow({
  participant,
  schluecke,
  shots,
  showSchluecke,
  showShots,
  canIncSchluecke,
  canIncShots,
  disabled,
  onBump,
}: {
  participant: Participant;
  schluecke: number;
  shots: number;
  showSchluecke: boolean;
  showShots: boolean;
  canIncSchluecke: boolean;
  canIncShots: boolean;
  disabled: boolean;
  onBump: (key: "schluecke" | "shots", delta: number) => void;
}) {
  const { t } = useI18n();
  const showBothDrinkTypes = showSchluecke && showShots;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: showBothDrinkTypes ? "start" : "center",
        gap: { xs: 0.5, sm: 1 },
      }}
    >
      <Typography sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        {participant.name}
      </Typography>
      <Stack
        direction={showBothDrinkTypes ? "column" : "row"}
        spacing={showBothDrinkTypes ? 0.2 : { xs: 0.5, sm: 2 }}
        sx={{
          alignItems: "flex-end",
          justifySelf: "end",
          maxWidth: "100%",
        }}
      >
        {showSchluecke && (
          <Stepper
            label={t("distribute.sipsShort")}
            ariaContext={`${participant.name} ${t("distribute.sipsShort")}`}
            value={schluecke}
            canInc={canIncSchluecke}
            disabled={disabled}
            onInc={() => onBump("schluecke", 1)}
            onDec={() => onBump("schluecke", -1)}
          />
        )}
        {showShots && (
          <Stepper
            label={t("distribute.shotsShort")}
            ariaContext={`${participant.name} ${t("distribute.shotsShort")}`}
            value={shots}
            canInc={canIncShots}
            disabled={disabled}
            onInc={() => onBump("shots", 1)}
            onDec={() => onBump("shots", -1)}
          />
        )}
      </Stack>
    </Box>
  );
}

function Stepper({
  label,
  ariaContext,
  value,
  canInc,
  disabled,
  onInc,
  onDec,
}: {
  label: string;
  ariaContext: string;
  value: number;
  canInc: boolean;
  disabled: boolean;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.25, sm: 0.5 },
        whiteSpace: "nowrap",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          opacity: 0.7,
          minWidth: { xs: 24, sm: 32 },
          fontSize: { xs: "0.65rem", sm: "0.75rem" },
        }}
      >
        {label}
      </Typography>
      <IconButton
        aria-label={`${ariaContext} minus`}
        size="small"
        onClick={onDec}
        disabled={disabled || value === 0}
        sx={{
          p: { xs: 0.25, sm: 0.5 },
        }}
      >
        <RemoveIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
      </IconButton>
      <Typography
        sx={{
          minWidth: { xs: 14, sm: 18 },
          textAlign: "center",
          fontSize: { xs: "0.9rem", sm: "1rem" },
        }}
      >
        {value}
      </Typography>
      <IconButton
        aria-label={`${ariaContext} plus`}
        size="small"
        onClick={onInc}
        disabled={disabled || !canInc}
        sx={{
          p: { xs: 0.25, sm: 0.5 },
        }}
      >
        <AddIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
      </IconButton>
    </Box>
  );
}

function formatVisibleDrinkSummary(
  t: (key: string, params?: Record<string, string | number>) => string,
  sips: number,
  shots: number,
) {
  const parts: string[] = [];

  if (sips > 0) {
    parts.push(t("history.sips", { count: sips }));
  }
  if (shots > 0) {
    parts.push(t("history.shots", { count: shots }));
  }

  return parts.length > 0 ? parts.join(t("history.and")) : t("history.sips", { count: 0 });
}

function getCardIcon(cardKey: string) {
  return isChestCardKey(cardKey) ? cardIcons[cardKey] : undefined;
}

async function postChestRoll(
  lobbyCode: string,
  chestRewardId: number,
  chestType: "safe" | "group" | "chaos",
  chooserId: number,
) {
  const data = await apiJson<{ data: RevealedChestResult }>(
    `/lobbies/${encodeURIComponent(lobbyCode)}/chest-rewards/${chestRewardId}/roll`,
    {
      method: "POST",
      body: JSON.stringify({ chest_type: chestType }),
      headers: {
        "content-type": "application/json",
        ...participantIdHeaders(chooserId),
      },
    },
  );
  return data.data;
}

async function acknowledgeChestReveal(
  lobbyCode: string,
  chestRewardId: number,
  chooserId: number,
) {
  await apiJson(
    `/lobbies/${encodeURIComponent(lobbyCode)}/chest-rewards/${chestRewardId}/acknowledge`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...participantIdHeaders(chooserId),
      },
    },
  );
}

async function postEffectChoice(
  lobbyCode: string,
  chestRewardId: number,
  choiceKey: string,
  chooserId: number,
) {
  const data = await apiJson<{ data: EffectChoiceResolutionResult }>(
    `/lobbies/${encodeURIComponent(lobbyCode)}/chest-rewards/${chestRewardId}/resolve-choice`,
    {
      method: "POST",
      body: JSON.stringify({ choice_key: choiceKey }),
      headers: {
        "content-type": "application/json",
        ...participantIdHeaders(chooserId),
      },
    },
  );
  return data.data;
}

async function postTargetResolution(
  lobbyCode: string,
  chestRewardId: number,
  targetParticipantId: number,
  viewerParticipantId: number,
) {
  const data = await apiJson<{
    data: { target_participant_id: number; result_participant_id: number };
  }>(`/lobbies/${encodeURIComponent(lobbyCode)}/chest-rewards/${chestRewardId}/resolve-target`, {
    method: "POST",
    body: JSON.stringify({ target_participant_id: targetParticipantId }),
    headers: {
      "content-type": "application/json",
      ...participantIdHeaders(viewerParticipantId),
    },
  });
  return data.data;
}

async function postDistribution(
  lobbyCode: string,
  body: {
    chest_reward_id?: number;
    elimination_id: number;
    offender_rumbler_id: number;
    victim_rumbler_id: number;
    splits: {
      receiver_participant_id: number;
      schluecke: number;
      shots: number;
    }[];
  },
  giverId: number,
) {
  await apiJson(`/lobbies/${encodeURIComponent(lobbyCode)}/distributions`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      ...participantIdHeaders(giverId),
    },
  });
}
