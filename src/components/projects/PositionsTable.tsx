// src/components/projects/PositionsTable.tsx
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

export type ProjectPosition = {
  id: string;
  project_id: string;
  name?: string | null;
  shift?: string | null;
  rotation_schedule?: string | null;
  status?: string | null;
};

export type PositionPatch = Partial<
  Pick<ProjectPosition, "name" | "shift" | "rotation_schedule" | "status">
>;

function normalizeStatus(value?: string | null) {
  return (value ?? "active").toString().trim().toLowerCase();
}

function statusChip(status: string) {
  if (status === "active")
    return <Chip size="small" label="Active" color="success" variant="outlined" />;
  if (status === "inactive")
    return <Chip size="small" label="Inactive" color="default" variant="outlined" />;
  return <Chip size="small" label={status} color="default" variant="outlined" />;
}

export default function PositionsTable({
  rows,
  isBusy = false,
  onAdd,
  onDeactivate,
  onUpdate,
}: {
  rows: ProjectPosition[];
  isBusy?: boolean;
  onAdd?: () => void;
  onDeactivate?: (positionId: string) => void;
  onUpdate?: (positionId: string, patch: PositionPatch) => void;
}) {
  const hasActions = Boolean(onDeactivate || onUpdate);
  const [showInactive, setShowInactive] = useState(false);

  const { visibleRows, activeCount, inactiveCount } = useMemo(() => {
    const active: ProjectPosition[] = [];
    const inactive: ProjectPosition[] = [];
    for (const r of rows) {
      const s = normalizeStatus(r.status);
      if (s === "inactive") inactive.push(r);
      else active.push(r);
    }
    return {
      visibleRows: showInactive ? [...active, ...inactive] : active,
      activeCount: active.length,
      inactiveCount: inactive.length,
    };
  }, [rows, showInactive]);

  return (
    <Paper variant="outlined">
      <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography variant="subtitle2">
          Positions: {activeCount} active{inactiveCount ? ` • ${inactiveCount} inactive` : ""}
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          {inactiveCount > 0 && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
              }
              label="Show inactive"
            />
          )}

          {onAdd && (
            <Button variant="contained" size="small" onClick={onAdd} disabled={isBusy}>
              Add Position
            </Button>
          )}
        </Box>
      </Box>

      {visibleRows.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2">No positions found.</Typography>
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Position</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Rotation</TableCell>
              <TableCell>Status</TableCell>
              {hasActions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.map((p) => {
              const status = normalizeStatus(p.status);
              const isActive = status === "active";

              return (
                <TableRow key={p.id} sx={{ opacity: isActive ? 1 : 0.6 }}>
                  <TableCell sx={{ fontWeight: 600 }}>{p.name ?? p.id}</TableCell>
                  <TableCell>{p.shift ?? "—"}</TableCell>
                  <TableCell>{p.rotation_schedule ?? "—"}</TableCell>
                  <TableCell>{statusChip(status)}</TableCell>

                  {hasActions && (
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        {onUpdate && (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isBusy}
                            onClick={() =>
                              onUpdate(p.id, {
                                name: p.name ?? "",
                                shift: p.shift ?? "",
                                rotation_schedule: p.rotation_schedule ?? "",
                              })
                            }
                          >
                            Edit
                          </Button>
                        )}

                        {onDeactivate && isActive && (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isBusy}
                            onClick={() => onDeactivate(p.id)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}