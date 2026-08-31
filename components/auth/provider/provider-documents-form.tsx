'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiService } from '@/lib/api';
import { toast } from 'react-toastify';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { VerificationDocument } from '@/types/auth';
import { useFormatter, useTranslations } from 'next-intl';

interface DocumentFile {
  file: File;
  type: string;
  name: string;
  uploadProgress: number;
  isUploaded: boolean;
  uploadedDocumentId?: string;
  error?: string;
  isUploading: boolean;
}

export function ProviderDocumentsForm() {
  const t = useTranslations('Onboarding');
  const common = useTranslations('Common');
  const format = useFormatter();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<VerificationDocument[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { nextProviderStep, previousProviderStep } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void apiService
      .getUserDocuments()
      .then((items) => {
        if (!cancelled) setExistingDocuments(items);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t('documentsLoadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newDocuments: DocumentFile[] = [];
    
    Array.from(files).forEach((file) => {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error(t('documentTypeError', { name: file.name }));
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(t('documentSizeError', { name: file.name }));
        return;
      }

      // Determine document type based on filename (matching backend enums)
      let docType = 'OTHER';
      const fileName = file.name.toLowerCase();
      if (fileName.includes('certificate') || fileName.includes('cert')) {
        docType = 'CERTIFICATION';
      } else if (fileName.includes('training')) {
        docType = 'TRAINING_CERTIFICATE';
      } else if (fileName.includes('license') || fileName.includes('licence')) {
        docType = 'LICENSE';
      } else if (fileName.includes('id') || fileName.includes('identity')) {
        docType = 'ID_DOCUMENT';
      }

      newDocuments.push({
        file,
        type: docType,
        name: file.name,
        uploadProgress: 0,
        isUploaded: false,
        isUploading: false
      });
    });

    setDocuments(prev => [...prev, ...newDocuments]);
    
    // Don't auto-upload - let user click upload button
  };

  const uploadDocument = async (docIndex: number): Promise<boolean> => {
    const currentDoc = documents[docIndex];
    if (!currentDoc) return false;

    let progressInterval: ReturnType<typeof setInterval> | undefined;
    try {
      // Mark as uploading
      setDocuments(prev => {
        const updated = [...prev];
        if (updated[docIndex]) {
          updated[docIndex].isUploading = true;
          updated[docIndex].error = undefined;
          updated[docIndex].uploadProgress = 0;
        }
        return updated;
      });

      // Simulate progress updates
      progressInterval = setInterval(() => {
        setDocuments(prev => {
          const updated = [...prev];
          if (updated[docIndex] && updated[docIndex].uploadProgress < 90) {
            updated[docIndex].uploadProgress += 15;
          }
          return updated;
        });
      }, 200);

      // Upload to API
      const result = await apiService.uploadDocument(currentDoc.file, currentDoc.type, `${currentDoc.type} document`);
      
      // Mark as completed
      setDocuments(prev => {
        const updated = [...prev];
        if (updated[docIndex]) {
          updated[docIndex].uploadProgress = 100;
          updated[docIndex].isUploaded = true;
          updated[docIndex].isUploading = false;
          updated[docIndex].uploadedDocumentId = result.id;
        }
        return updated;
      });
      return true;
    } catch (error) {
      console.error('Failed to upload document:', error);
      
      // Mark as failed
      setDocuments(prev => {
        const updated = [...prev];
        if (updated[docIndex]) {
          updated[docIndex].error = error instanceof Error ? error.message : t('uploadFailed');
          updated[docIndex].uploadProgress = 0;
          updated[docIndex].isUploading = false;
        }
        return updated;
      });
      
      toast.error(error instanceof Error ? error.message : t('documentUploadFailed', { name: currentDoc.name }));
      return false;
    } finally {
      if (progressInterval) clearInterval(progressInterval);
    }
  };

  const handleUploadAll = async () => {
    setIsLoading(true);
    try {
      // Upload all documents that haven't been uploaded yet
      const uploadPromises = documents.map((doc, index) => {
        if (!doc.isUploaded && !doc.isUploading) {
          return uploadDocument(index);
        }
        return Promise.resolve(true);
      });

      const results = await Promise.all(uploadPromises);
      const succeeded = results.every(Boolean);
      if (!succeeded) toast.error(t('someUploadsFailed'));
      return succeeded;
    } catch (error) {
      console.error('Failed to upload documents:', error);
      toast.error(t('someUploadsFailed'));
      return false; // Failed
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeDocument = async (index: number) => {
    const document = documents[index];
    if (!document) return;

    if (document.uploadedDocumentId) {
      try {
        await apiService.deleteDocument(document.uploadedDocumentId);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('documentRemoveFailed'),
        );
        return;
      }
    }

    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingDocument = async (documentId: string) => {
    try {
      await apiService.deleteDocument(documentId);
      setExistingDocuments((items) =>
        items.filter((document) => document.id !== documentId),
      );
      toast.success(t('documentRemoved'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('documentRemoveFailed'),
      );
    }
  };

  const handleSubmit = async () => {
    if (documents.length === 0 && existingDocuments.length === 0) {
      toast.error(t('documentRequired'));
      return;
    }

    // Upload all documents and proceed if successful
    const uploadSuccess = await handleUploadAll();
    
    if (uploadSuccess) {
      toast.success(t('documentsUploaded'));
      nextProviderStep();
    }
  };

  const handlePrevious = () => {
    previousProviderStep();
  };

  const hasDocuments = documents.length > 0 || existingDocuments.length > 0;
  const isUploading = documents.some(doc => doc.isUploading) || isLoading;
  const documentStatusLabel = (status: VerificationDocument['status']) => ({
    UPLOADED: t('documentUploadedStatus'),
    UNDER_REVIEW: t('documentReviewStatus'),
    APPROVED: t('documentApprovedStatus'),
    REJECTED: t('documentRejectedStatus'),
  })[status];

  return (
    <div className="p-5 sm:p-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>5/5</span>
          <span>80%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold leading-[38px] text-gray-900 dark:text-white font-inter tracking-[0%] mb-6">
          {t('finishSetup')}
        </h1>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('documentsTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('documentsBody')}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
            ${isDragging 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) fileInputRef.current?.click();
          }}
          aria-disabled={isUploading}
        >
          <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
            {t('clickUpload')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {t('dragDrop')}
          </p>
          <p className="text-xs text-gray-500">
            {t('fileRequirements')}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            handleFileSelect(e.target.files);
            e.currentTarget.value = '';
          }}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {/* Uploaded Documents */}
      {isLoadingExisting && (
        <p className="mb-4 text-sm text-gray-500" role="status">
          {t('existingDocumentsLoading')}
        </p>
      )}

      {existingDocuments.length > 0 && (
        <div className="mb-5 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('existingDocuments')}
          </p>
          {existingDocuments.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-green-700" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {document.originalName || document.fileName || t('verificationDocument')}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-gray-500">
                    {documentStatusLabel(document.status)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void removeExistingDocument(document.id)}
                disabled={isUploading}
                aria-label={t('removeDocument', { name: document.originalName || document.fileName || t('verificationDocument') })}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-red-700/75 hover:bg-red-50 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="mb-8 space-y-2">
          {documents.map((doc, index) => (
            <div
              key={`${doc.file.name}-${doc.file.lastModified}-${index}`}
              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex-shrink-0">
                  {doc.error ? (
                    <X className="w-5 h-5 text-red-500" />
                  ) : doc.isUploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    doc.error 
                      ? 'text-red-800 dark:text-red-200' 
                      : 'text-green-800 dark:text-green-200'
                  }`}>
                    {doc.name}
                  </p>
                  {doc.error ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {doc.error}
                    </p>
                  ) : doc.isUploading ? (
                    <div className="mt-1">
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1">
                        <div
                          className="bg-green-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${doc.uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : !doc.isUploaded && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('readyUpload')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {format.number(Math.round(doc.file.size / 1024))} KB
                </span>
                {doc.isUploading && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {doc.uploadProgress}%
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void removeDocument(index)}
                  disabled={isUploading}
                  aria-label={t('removeDocument', { name: doc.name })}
                  className="p-1 text-green-700/70 transition-colors hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={handlePrevious}
          className="text-gray-600 hover:text-gray-700"
        >
          ← {common('previous')}
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={!hasDocuments || isUploading}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? t('uploading') :
           !hasDocuments ? t('selectDocumentsFirst') :
           common('submit')}
        </Button>
      </div>
    </div>
  );
}
