import React, { useState, useEffect } from "react";
import {
  Building2,
  FileCheck,
  Upload,
  Trash2,
  ShieldCheck,
  Plus,
  X,
  CheckCircle2,
  FileText,
  Save,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchProfileThunk,
  submitOnboardingThunk,
  submitAadhaarKycThunk,
  uploadLegalDocThunk,
  deleteLegalDocThunk,
} from "../../store/slices/mandiSlice";
import { LegalDocType } from "../../interfaces";

export function MandiSettingsView() {
  const dispatch = useAppDispatch();
  const { profile, isActionLoading } = useAppSelector((state) => state.mandi);

  // Yard Address Form State
  const [yardAddress, setYardAddress] = useState("Plot No. 44, Industrial Area, Bypass Highway");
  const [district, setDistrict] = useState("Indore");
  const [state, setState] = useState("Madhya Pradesh");
  const [pinCode, setPinCode] = useState("452010");
  const [weighbridgeCount, setWeighbridgeCount] = useState<number>(4);

  // Aadhaar Modal / Update State
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState("8912");

  // Document Upload Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<LegalDocType>("MANDI_LICENSE");

  useEffect(() => {
    dispatch(fetchProfileThunk());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      if (profile.yardAddress) setYardAddress(profile.yardAddress);
      if (profile.district) setDistrict(profile.district);
      if (profile.state) setState(profile.state);
      if (profile.pinCode) setPinCode(profile.pinCode);
      if (profile.weighbridgeCount) setWeighbridgeCount(profile.weighbridgeCount);
    }
  }, [profile]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      submitOnboardingThunk({
        mandiName: profile?.mandiName || "Indore APMC Grain & Oilseed Market Yard",
        apmcCode: profile?.operatingLicense || "APMC-IND-2026-X992",
        address: yardAddress,
        district,
        state,
        operatingHours: "08:00 AM - 06:00 PM",
        operatingCommodities: ["WHEAT", "SOYBEAN", "MUSTARD", "RICE"],
      })
    );
  };

  const handleUpdateAadhaar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarInput) return;
    dispatch(
      submitAadhaarKycThunk({
        aadhaarNumber: `•••• •••• ${aadhaarInput.slice(-4)}`,
        aadhaarDocUrl: "https://agrovia.gov.in/docs/Aadhaar_Card_Verified_eSign.pdf",
      })
    );
    setShowAadhaarModal(false);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle) return;
    dispatch(
      uploadLegalDocThunk({
        documentType: newDocType,
        documentUrl: "https://agrovia.gov.in/docs/verified_upload.pdf",
        documentNumber: `DOC-${Date.now()}`,
      })
    );
    setShowDocModal(false);
    setNewDocTitle("");
  };

  const handleDeleteDoc = (docId: string) => {
    if (confirm("Remove this verified statutory compliance document?")) {
      dispatch(deleteLegalDocThunk(docId));
    }
  };

  const legalDocs = profile?.legalDocs || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* ═══ TITLE ═══ */}
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-3">
        <h1 className="text-xl font-black text-black dark:text-[#E5E5E5] tracking-tight">
          Mandi & KYC Settings
        </h1>
        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
          APMC accreditation, operator identity verification, and statutory legal licenses.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ═══ CARD 1: PHYSICAL YARD ADDRESS ═══ */}
        <div className="mandi-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
            <Building2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Physical Yard Address & Facility Info</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Physical Yard Address</label>
              <textarea
                rows={2}
                value={yardAddress}
                onChange={(e) => setYardAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Postal PIN Code</label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
                />
              </div>
            </div>

            <div className="sm:w-1/3">
              <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1.5">Electronic Weighbridges</label>
              <input
                type="number"
                value={weighbridgeCount}
                onChange={(e) => setWeighbridgeCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-semibold text-black dark:text-[#E5E5E5] focus:outline-none focus:border-[#5CE65C]"
              />
            </div>
          </div>
        </div>

        {/* ═══ CARD 2: AADHAAR IDENTITY VERIFICATION ═══ */}
        <div className="mandi-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Aadhaar Identity Verification</h2>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#5CE65C]/20 text-[#15803D] dark:text-[#5CE65C] border border-[#5CE65C]/40">
              ✓ Aadhaar Verified
            </span>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-gray-500 dark:text-neutral-400 uppercase">
                Linked Aadhaar Identification:
              </div>
              <div className="font-mono text-base font-black text-black dark:text-[#E5E5E5]">
                {profile?.aadhaarNumber || "•••• •••• 8912"}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                <span>Document: Aadhaar_Card_Verified_eSign.pdf</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAadhaarModal(true)}
              className="px-4 py-2 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-800 dark:text-[#E5E5E5] border border-gray-300 dark:border-neutral-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            >
              Update Aadhaar Card
            </button>
          </div>
        </div>

        {/* ═══ CARD 3: MANDI LEGAL DOCUMENTS & LICENSES ═══ */}
        <div className="mandi-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-black dark:text-[#E5E5E5]">Mandi Legal Documents & Licenses</h2>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                Upload APMC operating license, market committee registration, and tax credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDocModal(true)}
              className="btn-primary-green flex items-center gap-1.5 px-3.5 py-1.5 text-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {legalDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-black border border-gray-200 dark:border-neutral-800 flex items-center justify-center text-gray-600 dark:text-neutral-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-black dark:text-[#E5E5E5] text-xs">{doc.title}</div>
                    <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                      Type: {doc.docType} • Uploaded: {doc.uploadedAt || "2026-01-15"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#5CE65C]/20 text-[#15803D] dark:text-[#5CE65C] border border-[#5CE65C]/40">
                    {doc.status || "VERIFIED"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id)}
                    title="Remove Document"
                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ BOTTOM RIGHT SAVE BUTTON ═══ */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isActionLoading}
            className="btn-primary-green px-6 py-2.5 text-xs font-black cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Mandi Settings</span>
          </button>
        </div>
      </form>

      {/* ═══ MODAL: UPDATE AADHAAR ═══ */}
      {showAadhaarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-gray-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-neutral-800">
              <div className="font-bold text-xs text-black dark:text-[#E5E5E5]">Update Mandi Operator Aadhaar KYC</div>
              <button
                onClick={() => setShowAadhaarModal(false)}
                className="text-gray-400 hover:text-black dark:hover:text-[#E5E5E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAadhaar} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">12-Digit Aadhaar Number</label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value)}
                  placeholder="Enter 12 digits"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-mono text-sm font-bold text-black dark:text-[#E5E5E5]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Signed e-Aadhaar PDF</label>
                <div className="border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-4 text-center text-gray-500 dark:text-neutral-400 hover:border-[#5CE65C] cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto text-gray-400 dark:text-neutral-500 mb-1" />
                  <span className="font-semibold text-[11px]">Click to upload signed Aadhaar XML / PDF</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAadhaarModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-green px-5 py-2 font-bold cursor-pointer"
                >
                  Verify & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: ADD STATUTORY DOCUMENT ═══ */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#121212] border border-gray-300 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-neutral-800">
              <div className="font-bold text-xs text-black dark:text-[#E5E5E5]">Upload Statutory Mandi Document</div>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-gray-400 hover:text-black dark:hover:text-[#E5E5E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Document Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Mandi Yard Operating Certificate 2026-27"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-black dark:text-[#E5E5E5]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Document Classification</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as LegalDocType)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl font-semibold text-black dark:text-[#E5E5E5]"
                >
                  <option value="MANDI_LICENSE">MANDI LICENSE</option>
                  <option value="APMC_REGISTRATION">APMC REGISTRATION</option>
                  <option value="GST_CERTIFICATE">GST CERTIFICATE</option>
                  <option value="WEIGHBRIDGE_CALIBRATION">WEIGHBRIDGE CALIBRATION</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-neutral-300 mb-1">Upload Certified File</label>
                <div className="border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-4 text-center text-gray-500 dark:text-neutral-400 hover:border-[#5CE65C] cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto text-gray-400 dark:text-neutral-500 mb-1" />
                  <span className="font-semibold text-[11px]">Select certified PDF or scanned certificate</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-green px-5 py-2 font-bold cursor-pointer"
                >
                  Upload & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
