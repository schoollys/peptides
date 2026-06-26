'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ClaimStepper } from '@/components/claim/claim-stepper'
import { StepFind } from '@/components/claim/step-find'
import { StepKyb } from '@/components/claim/step-kyb'
import { StepProvisional } from '@/components/claim/step-provisional'
import type { SearchResult, ClaimResponse } from '@/lib/claim-data'

type Step = 1 | 2 | 3

export default function ClaimPage() {
  const [step, setStep]                       = useState<Step>(1)
  const [selectedProfile, setSelectedProfile] = useState<SearchResult | null>(null)
  const [claimResponse, setClaimResponse]     = useState<ClaimResponse | null>(null)

  function handleProfileSelect(profile: SearchResult) {
    setSelectedProfile(profile)
    // Stay on step 1 — contact/level fields now appear inline in StepFind
  }

  // Called when StepFind's inline submit succeeds — skip step 2, go to step 3
  function handleClaimSubmit(response: ClaimResponse) {
    setClaimResponse(response)
    setStep(3)
  }

  // Called when StepKyb (step 2) succeeds
  function handleKybSuccess(response: ClaimResponse) {
    setClaimResponse(response)
    setStep(3)
  }

  function handleBack() {
    setSelectedProfile(null)
    setStep(1)
  }

  return (
    <>
      <title>Заявить профиль компании — PeptideTrust</title>
      <Header />
      <main className="min-h-screen bg-background py-10 px-4">
        <div className="mx-auto max-w-[580px]">

          {/* Back link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            На главную
          </Link>

          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-heading text-[#061b31]">
              Заявите профиль компании
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Подтвердите, что это ваша компания, и получите независимую оценку доверия,
              которую видят покупатели при выборе поставщика.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-card shadow-stripe-md px-6 py-8 sm:px-8">

            {/* Stepper */}
            <ClaimStepper currentStep={step} />

            {/* Step content */}
            {step === 1 && (
              <StepFind
                onSelect={handleProfileSelect}
                onClaimSubmit={handleClaimSubmit}
              />
            )}

            {step === 2 && selectedProfile && (
              <StepKyb
                selectedProfile={selectedProfile}
                onSuccess={handleKybSuccess}
                onBack={handleBack}
              />
            )}

            {step === 3 && claimResponse && (
              <StepProvisional response={claimResponse} />
            )}
          </div>

          {/* Footer note */}
          {step !== 3 && (
            <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
              Данные защищены и обрабатываются в соответствии с политикой{' '}
              <a href="/legal/privacy" className="text-primary hover:underline">Privacy Policy PeptideTrust</a>.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
