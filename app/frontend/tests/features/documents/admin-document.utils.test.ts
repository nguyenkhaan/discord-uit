import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    filterAdminDocuments,
    getInitialDocumentDecision,
    type AdminDocumentFilter,
} from '@/features/documents/admin-document.utils';
import type { AdminDocument } from '@/features/documents/admin-document.type';

const documents: AdminDocument[] = [
    {
        id: 'doc-1',
        title: 'RAG cho hệ thống hỏi đáp',
        slug: 'rag-cho-he-thong-hoi-dap',
        summary: 'Tài liệu nghiên cứu RAG.',
        collectionSlugs: ['ai-intelligent-systems'],
        tagSlugs: ['artificial-intelligence', 'research'],
        status: 'PENDING',
        submittedBy: 'Nguyễn Minh',
        submittedAt: '2026-11-20T10:00:00Z',
        fileName: 'rag.pdf',
        fileType: 'PDF',
        fileSize: '2.4 MB',
        pageCount: 12,
        version: 1,
        previewKind: 'HTML',
        previewHtml: '<h1>RAG</h1>',
    },
    {
        id: 'doc-2',
        title: 'Thiết kế API an toàn',
        slug: 'thiet-ke-api-an-toan',
        summary: 'Nguyên tắc bảo mật API.',
        collectionSlugs: ['software-engineering-cloud'],
        tagSlugs: ['software-engineering', 'cloud'],
        status: 'APPROVED',
        submittedBy: 'Trần An',
        submittedAt: '2026-11-19T10:00:00Z',
        fileName: 'api.docx',
        fileType: 'DOCX',
        fileSize: '1.1 MB',
        pageCount: 8,
        version: 2,
        previewKind: 'DOCX',
        previewHtml: '<h1>API</h1>',
    },
];

const baseFilters: AdminDocumentFilter = {
    collectionSlug: 'ALL',
    tagSlug: 'ALL',
    status: 'ALL',
    search: '',
};

describe('admin document filtering', () => {
    it('filters by collection, tag, status and title search together', () => {
        const result = filterAdminDocuments(documents, {
            ...baseFilters,
            collectionSlug: 'ai-intelligent-systems',
            tagSlug: 'research',
            status: 'PENDING',
            search: 'rag',
        });

        assert.deepEqual(
            result.map((document) => document.id),
            ['doc-1']
        );
    });

    it('returns all documents when every filter is All or empty', () => {
        const result = filterAdminDocuments(documents, baseFilters);

        assert.deepEqual(
            result.map((document) => document.id),
            ['doc-1', 'doc-2']
        );
    });
});

describe('admin document decision state', () => {
    it('leaves pending documents without a selected decision', () => {
        assert.equal(getInitialDocumentDecision('PENDING'), '');
    });

    it('keeps the current decision for already processed documents', () => {
        assert.equal(getInitialDocumentDecision('APPROVED'), 'APPROVED');
        assert.equal(getInitialDocumentDecision('REJECTED'), 'REJECTED');
    });
});
