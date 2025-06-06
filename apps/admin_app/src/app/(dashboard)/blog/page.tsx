'use client';
import {Suspense} from "react";
import CustomMDXEditor from "@/components/mdx-editor";
export default () => {
  const markdown = `
Hello **world**!
`
  return (
    <> <Suspense fallback={null}>
      <CustomMDXEditor value={markdown}></CustomMDXEditor>
    </Suspense>
    </>
  );
};
