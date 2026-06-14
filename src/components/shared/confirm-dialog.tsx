"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  abierto: boolean
  titulo: string
  descripcion: string
  etiquetaConfirmar?: string
  variante?: "destructive" | "default"
  onConfirmar: () => void
  onCancelar: () => void
  cargando?: boolean
}

export function ConfirmDialog({
  abierto,
  titulo,
  descripcion,
  etiquetaConfirmar = "Confirmar",
  variante = "destructive",
  onConfirmar,
  onCancelar,
  cargando = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCancelar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            variant={variante}
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? "Guardando..." : etiquetaConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
