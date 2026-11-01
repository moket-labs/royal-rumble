import { Box } from "@mui/material";
import { css } from "@emotion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InputField } from "../components/form";
import { PrimaryButton } from "../components/buttons";
import { useI18n } from "../i18n";
import { usePublicPageview } from "../hooks/use_public_pageview";

export default function CreateJoinLobby() {
  const establishedYear = 2022;
  const currentYear = new Date().getFullYear();
  const [lobbyCode, setLobbyCode] = useState("");
  const { t } = useI18n();
  const navigate = useNavigate();
  const normalizedCode = lobbyCode.trim().toUpperCase();
  usePublicPageview(lobbyCode.length > 0);

  const updateLobbyCode = (value: string) => {
    setLobbyCode(value.toUpperCase());
  };

  const joinLobby = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizedCode) return;
    navigate(`/lobbies/${encodeURIComponent(normalizedCode)}`);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        pt: 2,
        pb: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          className="edition-year"
          aria-label={
            t("landing.ariaEdition", {
              currentYear,
              establishedYear,
            })
          }
        >
          <div className="edition-year__headline">
            <span className="edition-year__number">{currentYear}</span>
            <span className="edition-year__word">{t("landing.edition")}</span>
          </div>
          <div className="edition-year__est">
            {t("landing.established", { year: establishedYear })}
          </div>
        </div>
      </Box>

      <Box component="form" onSubmit={joinLobby}>
        <InputField
          label={t("landing.lobbyCode")}
          htmlFor="lobby-code"
          id="lobby-code"
          value={lobbyCode}
          onChange={updateLobbyCode}
        />
        <PrimaryButton
          sx={{ mt: 2 }}
          type="submit"
          disabled={!normalizedCode}
          css={css`
            width: 100%;
          `}
        >
          {t("landing.join")}
        </PrimaryButton>
        <PrimaryButton
          css={css`
            width: 100%;
          `}
          sx={{ mt: 5 }}
          href="/lobbies/create"
        >
          {t("landing.create")}
        </PrimaryButton>
      </Box>
    </Box>
  );
}
