import { useState, useEffect, useRef } from "react";
import { ClockIcon, NavigationIcon } from "../../../components/ui/Icons";
import { useAuthStore } from "../../../store/auth-store";
import { getStudentSchedulesApi, type Schedule } from "@ito-map/shared";

const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"] as const;
type Day = (typeof DAYS)[number];
const DAY_NUMBER: Record<Day, number> = {
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
};

function getDefaultDay(): Day {
  const d = new Date().getDay(); // 0=Dom
  const iso = d === 0 ? 7 : d;
  return iso >= 1 && iso <= 5 ? DAYS[iso - 1] : DAYS[0];
}

interface SchedulePanelProps {
  expanded?: boolean;
  onNavigateToClass?: (buildingCode: string) => void;
}

export function SchedulePanel({
  expanded = false,
  onNavigateToClass,
}: SchedulePanelProps) {
  const { user, setControlNumber } = useAuthStore();
  const controlNumber = user?.controlNumber ?? "";

  const [selectedDay, setSelectedDay] = useState<Day>(getDefaultDay);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!controlNumber) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSchedules([]);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    getStudentSchedulesApi(controlNumber)
      .then((data) => {
        if (!controller.signal.aborted) {
          setSchedules(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const msg =
          err instanceof Error && err.message.includes("404")
            ? "Número de control no encontrado en el sistema."
            : "No se pudo cargar el horario. Intenta más tarde.";
        setError(msg);
        setSchedules([]);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [controlNumber]);

  const handleLink = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setControlNumber(trimmed);
    setInputValue("");
  };

  const handleClearControlNumber = () => {
    setControlNumber("");
    setSchedules([]);
    setError(null);
  };

  const todayClasses = schedules.filter(
    (s) => s.day_of_week === DAY_NUMBER[selectedDay]
  );

  return (
    <div className={`schedule-panel ${expanded ? "schedule-panel--expanded" : ""}`}>
      <div className="schedule-panel__header">
        <h3 className="schedule-panel__title">
          <ClockIcon size={18} />
          <span>Horario de Clases</span>
        </h3>
        {controlNumber && !loading && (
          <button
            type="button"
            className="schedule-panel__unlink"
            onClick={handleClearControlNumber}
            title="Cambiar número de control"
          >
            Cambiar
          </button>
        )}
      </div>

      {!controlNumber ? (
        <div className="schedule-panel__link-prompt">
          <p className="schedule-panel__link-hint">
            Ingresa tu número de control para ver tu horario de clases.
          </p>
          <div className="schedule-panel__link-form">
            <input
              type="text"
              className="schedule-panel__link-input"
              placeholder="Ej. 22000123"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              maxLength={20}
              autoComplete="off"
            />
            <button
              type="button"
              className="schedule-panel__link-btn"
              onClick={handleLink}
              disabled={!inputValue.trim()}
            >
              Vincular
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="schedule-panel__loading">
          <span>Cargando horario...</span>
        </div>
      ) : error ? (
        <div className="schedule-panel__error">
          <p>{error}</p>
          <button
            type="button"
            className="schedule-panel__link-btn schedule-panel__link-btn--sm"
            onClick={handleClearControlNumber}
          >
            Cambiar número de control
          </button>
        </div>
      ) : (
        <>
          <div className="schedule-panel__days">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className={`schedule-panel__day ${selectedDay === day ? "is-active" : ""}`}
                onClick={() => setSelectedDay(day)}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          <div className="schedule-panel__classes">
            {todayClasses.length === 0 ? (
              <div className="schedule-panel__empty">
                <p>No tienes clases este día</p>
              </div>
            ) : (
              todayClasses.map((s) => (
                <div key={s.id} className="schedule-class">
                  <div className="schedule-class__time">
                    <span>{s.start_time}</span>
                    <span className="schedule-class__time-end">{s.end_time}</span>
                  </div>

                  <div className="schedule-class__content">
                    <h4 className="schedule-class__name">{s.subject}</h4>
                    {s.professor_name && (
                      <p className="schedule-class__professor">{s.professor_name}</p>
                    )}
                    <div className="schedule-class__location">
                      <span className="schedule-class__building-code">{s.building_code}</span>
                      <span className="schedule-class__room">{s.classroom_code}</span>
                    </div>
                  </div>

                  {s.building_code && (
                    <button
                      type="button"
                      className="schedule-class__navigate"
                      onClick={() => onNavigateToClass?.(s.building_code)}
                      title={`Ir a ${s.building_name}`}
                    >
                      <NavigationIcon size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
