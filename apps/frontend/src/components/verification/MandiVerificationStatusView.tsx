import React, { useState, useRef } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Camera,
  Trash2,
  Eye,
  Download,
  Plus,
  X,
  Building2,
  CreditCard,
  User,
  ExternalLink,
  Lock,
  RefreshCw,
  Sparkles,
  Check,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  submitAadhaarKycThunk,
  uploadLegalDocThunk,
  deleteLegalDocThunk,
} from "../../store/slices/mandiSlice";
import { MandiLegalDoc, LegalDocType } from "../../interfaces";

export function MandiVerificationStatusView() {
  const dispatch = useAppDispatch();
  const { profile, isActionLoading } = useAppSelector((state) => state.mandi);

  // ═══ 1. PROFILE PHOTO STATE ═══
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>(
    profile?.avatarUrl ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
  );
  const fileInputProfileRef = useRef<HTMLInputElement | null>(null);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setProfilePhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePhoto = () => {
    setProfilePhotoUrl("");
  };

  // ═══ 2. AADHAAR CARD VERIFICATION STATE ═══
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(
    profile?.aadhaarNumber || "7842 9012 8912"
  );
  const [aadhaarName, setAadhaarName] = useState<string>("Warren Patel");
  const [isAadhaarVerified, setIsAadhaarVerified] = useState<boolean>(
    profile?.aadhaarVerified ?? true
  );
  const [aadhaarFrontName, setAadhaarFrontName] = useState<string>("aadhaar_card_front.jpg");
  const [aadhaarBackName, setAadhaarBackName] = useState<string>("aadhaar_card_back.jpg");
  const [showAadhaarOtpModal, setShowAadhaarOtpModal] = useState<boolean>(false);
  const [aadhaarOtpInput, setAadhaarOtpInput] = useState<string>("");
  const [aadhaarOtpError, setAadhaarOtpError] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  const fileInputAadhaarFrontRef = useRef<HTMLInputElement | null>(null);
  const fileInputAadhaarBackRef = useRef<HTMLInputElement | null>(null);

  const handleAadhaarFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadhaarFrontName(file.name);
    }
  };

  const handleAadhaarBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadhaarBackName(file.name);
    }
  };

  const handleTriggerAadhaarKyc = (e: React.FormEvent) => {
    e.preventDefault();
    setAadhaarOtpError("");
    setAadhaarOtpInput("");
    setShowAadhaarOtpModal(true);
  };

  const handleConfirmAadhaarOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarOtpInput.length < 4) {
      setAadhaarOtpError("Please enter valid 6-digit Aadhaar OTP (e.g. 123456)");
      return;
    }
    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      setIsAadhaarVerified(true);
      setShowAadhaarOtpModal(false);
      dispatch(
        submitAadhaarKycThunk({
          aadhaarNumber: aadhaarNumber.replace(/\s/g, ""),
          aadhaarDocUrl: "https://agrovia.gov.in/docs/aadhaar_verified.pdf",
        })
      );
    }, 1000);
  };

  // ═══ 3. LEGAL DOCUMENTS STATE ═══
  const initialLegalDocs: MandiLegalDoc[] = [
    {
      id: "doc-1",
      title: "APMC Mandi Operating License 2026–28",
      documentType: "MANDI_LICENSE",
      documentNumber: "MP-APMC-IND-2026-X992",
      documentUrl: "https://example.com/docs/apmc_license.pdf",
      verified: true,
      createdAt: "2026-01-15",
      status: "APPROVED",
      uploadedAt: "15 Jan 2026",
    },
    {
      id: "doc-2",
      title: "State Agricultural Marketing Board Gazette Notification",
      documentType: "APMC_REGISTRATION",
      documentNumber: "SMB/WZ/IND/4412/2022",
      documentUrl: "https://example.com/docs/state_registration.pdf",
      verified: true,
      createdAt: "2026-02-10",
      status: "APPROVED",
      uploadedAt: "10 Feb 2026",
    },
    {
      id: "doc-3",
      title: "Mandi Board GSTIN & Statutory Tax Exemption",
      documentType: "GST_CERTIFICATE",
      documentNumber: "23AAAPA1234A1Z5",
      documentUrl: "https://example.com/docs/gst_certificate.pdf",
      verified: true,
      createdAt: "2026-03-01",
      status: "APPROVED",
      uploadedAt: "01 Mar 2026",
    },
    {
      id: "doc-4",
      title: "Legal Metrology Weights & Measures Calibration Certificate",
      documentType: "OTHER",
      documentNumber: "W&M/IND/CALIB-2026/881",
      documentUrl: "https://example.com/docs/weights_measures.pdf",
      verified: true,
      createdAt: "2026-05-18",
      status: "APPROVED",
      uploadedAt: "18 May 2026",
    },
    {
      id: "doc-5",
      title: "Sub-Yard Land Title & Premises Lease Deed",
      documentType: "OTHER",
      documentNumber: "DEED-YARD-B-IND-2021-99",
      documentUrl: "https://example.com/docs/land_deed.pdf",
      verified: true,
      createdAt: "2026-06-20",
      status: "APPROVED",
      uploadedAt: "20 Jun 2026",
    },
  ];

  const [legalDocs, setLegalDocs] = useState<MandiLegalDoc[]>(
    profile?.legalDocs && profile.legalDocs.length > 0
      ? profile.legalDocs
      : initialLegalDocs
  );

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [newDocTitle, setNewDocTitle] = useState<string>("");
  const [newDocType, setNewDocType] = useState<LegalDocType>("MANDI_LICENSE");
  const [newDocNumber, setNewDocNumber] = useState<string>("");
  const [newDocFileName, setNewDocFileName] = useState<string>("");

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<MandiLegalDoc | null>(null);

  const handleAddNewDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc: MandiLegalDoc = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      documentType: newDocType,
      documentNumber: newDocNumber.trim() || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      documentUrl: "https://agrovia.gov.in/docs/legal_sample.pdf",
      verified: true,
      status: "APPROVED",
      createdAt: new Date().toISOString(),
      uploadedAt: "Just now",
    };

    setLegalDocs([newDoc, ...legalDocs]);
    dispatch(
      uploadLegalDocThunk({
        documentType: newDocType,
        documentUrl: newDoc.documentUrl,
        documentNumber: newDoc.documentNumber || undefined,
      })
    );

    setNewDocTitle("");
    setNewDocNumber("");
    setNewDocFileName("");
    setShowUploadModal(false);
  };

  const handleDeleteDocument = (id: string) => {
    setLegalDocs(legalDocs.filter((d) => d.id !== id));
    dispatch(deleteLegalDocThunk(id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans pb-10">
      {/* ═══ 1. COMPLIANCE & VERIFICATION HEADER BANNER ═══ */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 shadow-subtle border border-slate-200/80 dark:border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-black border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#E5E5E5] tracking-tight">
                Mandi Statutory Verification &amp; KYC Hub
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-3xl leading-relaxed">
              Official regulatory compliance management for APMC Indore Central (Yard B). Manage officer biometric Aadhaar credentials, statutory APMC trading permits, legal deeds, and officer identity verification.
            </p>
          </div>

          {/* Compliance Status Pill Box */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#171717] p-3.5 rounded-xl border border-slate-200/80 dark:border-neutral-800 shrink-0">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-black border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-[#E5E5E5]">
                  Tier-1 APMC Certified
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-black border dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5">
                3 of 3 Statutory Pillars Verified • eNAM Compliant
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 2. GRID: PROFILE PHOTO + AADHAAR CARD VERIFICATION ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ═══ COMPONENT A: ADD / MANAGE PROFILE PHOTO (4 Cols) ═══ */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121212] rounded-2xl p-6 shadow-subtle border border-slate-200/80 dark:border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#E5E5E5] uppercase tracking-wider">
                  Mandi Officer Profile Photo
                </h2>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-black border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400">
                ● Identity Verified
              </span>
            </div>

            {/* Profile Avatar Box */}
            <div className="py-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-900 shadow-md flex items-center justify-center">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Mandi Operator"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-400 dark:text-neutral-500" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputProfileRef.current?.click()}
                  title="Upload New Profile Photo"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputProfileRef}
                  onChange={handleProfilePhotoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#E5E5E5]">
                  Warren Patel
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  Chief Mandi Officer &amp; Yard Superintendent
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-[11px] text-slate-400 dark:text-neutral-400 font-mono">
                  <span>ID: APMC-IND-719</span>
                  <span>•</span>
                  <span>Indore Division</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed bg-slate-50 dark:bg-[#171717] p-3.5 rounded-xl border border-slate-200/80 dark:border-neutral-800">
              Clear facial photograph used on gate manifests, digital weighbridge sign-offs, and farmer DBT settlement certificates. Maximum 5MB (PNG/JPG).
            </p>
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-3">
            <button
              onClick={() => fileInputProfileRef.current?.click()}
              className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change Photo</span>
            </button>
            {profilePhotoUrl && (
              <button
                onClick={handleRemoveProfilePhoto}
                className="py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 transition cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* ═══ COMPONENT B: ADD / VERIFY AADHAAR CARD FOR MANDI (7 Cols) ═══ */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121212] rounded-2xl p-6 shadow-subtle border border-slate-200/80 dark:border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#E5E5E5] uppercase tracking-wider">
                  Aadhaar Card Verification for Mandi
                </h2>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  isAadhaarVerified
                    ? "bg-emerald-50 dark:bg-black border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-black border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-400"
                }`}
              >
                {isAadhaarVerified ? "✓ UIDAI Verified" : "Pending OTP"}
              </span>
            </div>

            <form onSubmit={handleTriggerAadhaarKyc} className="py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase mb-1">
                    12-Digit Aadhaar Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase mb-1">
                    Full Name (As on Aadhaar)
                  </label>
                  <input
                    type="text"
                    value={aadhaarName}
                    onChange={(e) => setAadhaarName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-slate-900 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Aadhaar Document Files (Front & Back) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase mb-2">
                  Aadhaar Card Scans (Front &amp; Back Sides)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Front Side Upload */}
                  <div
                    onClick={() => fileInputAadhaarFrontRef.current?.click()}
                    className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-neutral-900/40 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-black border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 dark:text-[#E5E5E5] truncate">
                          {aadhaarFrontName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-400">
                          Aadhaar Front Side • Verified
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-2">
                      Change
                    </span>
                    <input
                      type="file"
                      ref={fileInputAadhaarFrontRef}
                      onChange={handleAadhaarFrontUpload}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                  </div>

                  {/* Back Side Upload */}
                  <div
                    onClick={() => fileInputAadhaarBackRef.current?.click()}
                    className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-neutral-900/40 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-black border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 dark:text-[#E5E5E5] truncate">
                          {aadhaarBackName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-400">
                          Aadhaar Back Side • Verified
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-2">
                      Change
                    </span>
                    <input
                      type="file"
                      ref={fileInputAadhaarBackRef}
                      onChange={handleAadhaarBackUpload}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>UIDAI 256-bit encrypted e-KYC authentication</span>
            </div>
            <button
              onClick={handleTriggerAadhaarKyc}
              className="py-2 px-4 text-xs font-bold rounded-xl bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 text-white transition shadow-xs cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAadhaarVerified ? "Re-Verify Aadhaar via OTP" : "Verify Aadhaar with OTP"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 3. LEGAL & APMC STATUTORY DOCUMENTS (FULL WIDTH) ═══ */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-subtle border border-slate-200/80 dark:border-neutral-800 overflow-hidden">
        {/* Section Header with Action Button */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-[#E5E5E5] tracking-tight">
                APMC Legal &amp; Statutory Accreditation Documents
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Active operating licenses, state mandi gazette registrations, GST tax exemption certificates, and weighbridge legal metrology permits.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Legal Document</span>
          </button>
        </div>

        {/* Legal Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4">DOCUMENT NAME &amp; CATEGORY</th>
                <th className="py-3.5 px-4">REGISTRATION / REF NUMBER</th>
                <th className="py-3.5 px-4">UPLOAD DATE</th>
                <th className="py-3.5 px-4 text-center">STATUTORY STATUS</th>
                <th className="py-3.5 pl-4 pr-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
              {legalDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-neutral-500">
                    No legal documents currently uploaded. Click "Add Legal Document" to attach official permits.
                  </td>
                </tr>
              ) : (
                legalDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-neutral-900/40 transition"
                  >
                    {/* Document Title & Badge */}
                    <td className="py-4 pl-6 pr-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-black border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-300 shrink-0">
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-[#E5E5E5] text-sm block">
                            {doc.title}
                          </span>
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-slate-400 dark:text-neutral-400 uppercase tracking-wider">
                            {doc.documentType.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Reference Number */}
                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800 dark:text-[#E5E5E5] text-xs">
                        {doc.documentNumber || "REF-MP-719"}
                      </span>
                    </td>

                    {/* Upload Date */}
                    <td className="py-4 px-4 align-middle whitespace-nowrap text-slate-500 dark:text-neutral-400">
                      {doc.uploadedAt || "Active"}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-black border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>VERIFIED &amp; VALID</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-4 pr-6 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-[#E5E5E5] flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                          <span>View Doc</span>
                        </button>
                        <button
                          onClick={() => window.open(doc.documentUrl, "_blank")}
                          title="Download Document"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete Document"
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-950 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#121212] border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-neutral-400 gap-2">
          <span>
            Total {legalDocs.length} statutory legal instruments actively bound to Indore Mandi Yard B.
          </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            Next Scheduled Audit: 31 March 2027
          </span>
        </div>
      </div>

      {/* ═══ MODAL 1: ADD NEW LEGAL DOCUMENT ═══ */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-[#E5E5E5]">
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Upload Mandi Legal / Regulatory Document</span>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewDocumentSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 uppercase mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Fire Safety Clearance Certificate 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black border border-slate-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 uppercase mb-1">
                    Document Category
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as LegalDocType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black border border-slate-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MANDI_LICENSE">Mandi Operating License</option>
                    <option value="APMC_REGISTRATION">APMC Board Gazette</option>
                    <option value="GST_CERTIFICATE">GST & Tax Compliance</option>
                    <option value="OTHER">Weighbridge / Land / Other Permit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-neutral-300 uppercase mb-1">
                    Registration / Reference No.
                  </label>
                  <input
                    type="text"
                    value={newDocNumber}
                    onChange={(e) => setNewDocNumber(e.target.value)}
                    placeholder="e.g. MP-GOV-2026-881"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black border border-slate-300 dark:border-neutral-800 rounded-xl text-xs font-mono text-slate-900 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Upload Drop Area */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 uppercase mb-1">
                  Upload Scanned PDF / Image File
                </label>
                <div className="p-6 border-2 border-dashed border-slate-300 dark:border-neutral-700 rounded-xl text-center bg-slate-50/50 dark:bg-black/50 hover:border-emerald-500 transition cursor-pointer">
                  <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 dark:text-[#E5E5E5]">
                    {newDocFileName || "Click to browse or drag document file"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Accepts PDF, JPG, PNG up to 15MB
                  </p>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setNewDocFileName(file.name);
                    }}
                    accept=".pdf,image/*"
                    className="mt-2 text-xs text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs"
                >
                  Save &amp; Bind Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: AADHAAR OTP AUTHENTICATION SIMULATOR ═══ */}
      {showAadhaarOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-[#E5E5E5]">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>UIDAI Aadhaar OTP Authentication</span>
              </div>
              <button
                onClick={() => setShowAadhaarOtpModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAadhaarOtp} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-neutral-300">
                A 6-digit one-time password (OTP) has been dispatched to the mobile number registered with Aadhaar <strong className="font-mono text-slate-900 dark:text-white">XXXX XXXX {aadhaarNumber.slice(-4)}</strong>.
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-neutral-300 uppercase mb-1">
                  Enter 6-Digit Verification OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={aadhaarOtpInput}
                  onChange={(e) => setAadhaarOtpInput(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full text-center tracking-widest text-lg font-mono font-black py-2.5 bg-slate-50 dark:bg-black border border-slate-300 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-[#E5E5E5] focus:outline-none focus:border-emerald-500"
                />
                {aadhaarOtpError && (
                  <p className="text-red-500 text-[11px] font-semibold mt-1">
                    {aadhaarOtpError}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-2 text-center">
                  Demo Simulation: Enter any 4-6 digit code to confirm verification.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAadhaarOtpModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Verify</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: DOCUMENT VIEWER PREVIEW ═══ */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-[#E5E5E5]">
                    {viewingDoc.title}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Ref: {viewingDoc.documentNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Certificate Simulator Preview */}
            <div className="p-8 space-y-6 bg-slate-50/70 dark:bg-black/80 text-xs">
              <div className="border-2 border-dashed border-slate-300 dark:border-neutral-800 p-8 rounded-2xl bg-white dark:bg-[#161616] text-center space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-2 right-2 px-3 py-1 bg-emerald-50 dark:bg-black border border-emerald-300 dark:border-emerald-800/60 rounded-full text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">
                  GOVERNMENT APMC VERIFIED
                </div>

                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-black border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-[#E5E5E5]">
                    Agricultural Produce Market Committee (APMC)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Statutory Accreditation &amp; Market Yard Regulatory Certificate
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-neutral-800 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Document Type:</span>
                    <strong className="text-slate-800 dark:text-[#E5E5E5]">{viewingDoc.documentType}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registration Reference:</span>
                    <strong className="font-mono text-slate-800 dark:text-[#E5E5E5]">{viewingDoc.documentNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jurisdiction Yard:</span>
                    <strong className="text-slate-800 dark:text-[#E5E5E5]">Indore Central — Sub Yard B</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verification Status:</span>
                    <span className="text-emerald-600 font-extrabold">AUTHENTICATED &amp; CURRENT</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Digital instrument signed with PKI certificate under the Agricultural Marketing Regulation Act.
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-[#E5E5E5] font-bold rounded-xl transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
