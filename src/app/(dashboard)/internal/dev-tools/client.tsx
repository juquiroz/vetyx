"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PestanaResetClinico } from "@/components/dev/pestana-reset-clinico"
import { PestanaResetCompleto } from "@/components/dev/pestana-reset-completo"
import { PestanaResetGlobal } from "@/components/dev/pestana-reset-global"
import { PestanaDataset } from "@/components/dev/pestana-dataset"
import { PestanaExportImport } from "@/components/dev/pestana-export-import"

export function DevToolsClient() {
  return (
    <Tabs defaultValue="reset-global" className="space-y-4">
      <TabsList>
        <TabsTrigger value="reset-global">Reset Global</TabsTrigger>
        <TabsTrigger value="reset-clinico">Reset Datos</TabsTrigger>
        <TabsTrigger value="reset-completo">Reset Completo</TabsTrigger>
        <TabsTrigger value="dataset">Dataset Demo</TabsTrigger>
        <TabsTrigger value="export-import">Export / Import</TabsTrigger>
      </TabsList>
      <TabsContent value="reset-global">
        <PestanaResetGlobal />
      </TabsContent>
      <TabsContent value="reset-clinico">
        <PestanaResetClinico />
      </TabsContent>
      <TabsContent value="reset-completo">
        <PestanaResetCompleto />
      </TabsContent>
      <TabsContent value="dataset">
        <PestanaDataset />
      </TabsContent>
      <TabsContent value="export-import">
        <PestanaExportImport />
      </TabsContent>
    </Tabs>
  )
}
