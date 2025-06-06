'use client'
import {Inter} from 'next/font/google';
import React from 'react';
import {AntdRegistry} from '@ant-design/nextjs-registry';
import {Providers} from "@/app/providers";
import AuthGuard from '@/guards/AuthGuard';


export default function RootLayout(props: { children: React.ReactNode }) {
  const {children} = props;
  return (
    <html lang="en" suppressHydrationWarning>
    <body suppressHydrationWarning>
    <AntdRegistry><Providers><AuthGuard>
                {children}
              </AuthGuard></Providers></AntdRegistry>
    </body>
    </html>
  );
}
