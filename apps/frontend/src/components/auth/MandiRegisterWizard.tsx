import React, { useState } from "react";
import { RegisterStep1Credentials } from "./RegisterStep1Credentials";
import { RegisterOtpVerification } from "./RegisterOtpVerification";
import { RegisterStep2Location } from "./RegisterStep2Location";
import { RegisterStep3Slots } from "./RegisterStep3Slots";
import { Check } from "lucide-react";

interface MandiRegisterWizardProps {
  onSwitchToLogin: () => void;
  onFinishRegistration: () => void;
}

type WizardStage = "STEP1_CREDENTIALS" | "STEP1_OTP" | "STEP2_LOCATION" | "STEP3_SLOTS";

export function MandiRegisterWizard({
  onSwitchToLogin,
  onFinishRegistration,
}: MandiRegisterWizardProps) {
  const [stage, setStage] = useState<WizardStage>("STEP1_CREDENTIALS");
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  const currentStepNumber =
    stage === "STEP1_CREDENTIALS" || stage === "STEP1_OTP"
      ? 1
      : stage === "STEP2_LOCATION"
      ? 2
      : 3;

  return (
    <div className="space-y-5">
      {/* Step Progress Indicator Bar */}
      <div className="flex items-center justify-between px-2">
        {/* Step 1 */}
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition ${
              currentStepNumber > 1
                ? "bg-emerald-500 text-white"
                : currentStepNumber === 1
                ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {currentStepNumber > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "1"}
          </div>
          <span
            className={`text-xs font-semibold ${
              currentStepNumber >= 1 ? "text-slate-900" : "text-slate-400"
            }`}
          >
            Account
          </span>
        </div>

        <div
          className={`flex-1 h-0.5 mx-2 rounded-full transition ${
            currentStepNumber > 1 ? "bg-emerald-500" : "bg-slate-200"
          }`}
        />

        {/* Step 2 */}
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition ${
              currentStepNumber > 2
                ? "bg-emerald-500 text-white"
                : currentStepNumber === 2
                ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {currentStepNumber > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
          </div>
          <span
            className={`text-xs font-semibold ${
              currentStepNumber >= 2 ? "text-slate-900" : "text-slate-400"
            }`}
          >
            Location
          </span>
        </div>

        <div
          className={`flex-1 h-0.5 mx-2 rounded-full transition ${
            currentStepNumber > 2 ? "bg-emerald-500" : "bg-slate-200"
          }`}
        />

        {/* Step 3 */}
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition ${
              currentStepNumber === 3
                ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            3
          </div>
          <span
            className={`text-xs font-semibold ${
              currentStepNumber === 3 ? "text-slate-900" : "text-slate-400"
            }`}
          >
            Slots
          </span>
        </div>
      </div>

      {/* Wizard Stages */}
      {stage === "STEP1_CREDENTIALS" && (
        <RegisterStep1Credentials
          onSuccessRegistered={(email) => {
            setRegisteredEmail(email);
            setStage("STEP1_OTP");
          }}
          onSwitchToLogin={onSwitchToLogin}
        />
      )}

      {stage === "STEP1_OTP" && (
        <RegisterOtpVerification
          email={registeredEmail}
          onVerifiedSuccess={() => {
            setStage("STEP2_LOCATION");
          }}
          onBackToStep1={() => setStage("STEP1_CREDENTIALS")}
        />
      )}

      {stage === "STEP2_LOCATION" && (
        <RegisterStep2Location
          onLocationSaved={() => {
            setStage("STEP3_SLOTS");
          }}
        />
      )}

      {stage === "STEP3_SLOTS" && (
        <RegisterStep3Slots
          onCompleteOnboarding={onFinishRegistration}
        />
      )}
    </div>
  );
}
