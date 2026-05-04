import { useState } from "react";
import { ClockIcon, MapIcon, NavigationIcon } from "../../shared/Icons";

interface ScheduleClass {
  id: string;
  name: string;
  professor: string;
  building: string;
  buildingCode: string;
  room: string;
  time: string;
  day: string;
}

// Mock schedule data - in production this would come from an API
const mockSchedule: ScheduleClass[] = [
  {
    id: "1",
    name: "Calculo Diferencial",
    professor: "Dr. Martinez Garcia",
    building: "Edificio E",
    buildingCode: "E",
    room: "E-201",
    time: "07:00 - 08:00",
    day: "Lunes",
  },
  {
    id: "2",
    name: "Fisica I",
    professor: "Ing. Lopez Hernandez",
    building: "Laboratorio de Fisico-Quimica",
    buildingCode: "FQ",
    room: "Lab 1",
    time: "08:00 - 10:00",
    day: "Lunes",
  },
  {
    id: "3",
    name: "Programacion",
    professor: "M.C. Sanchez Ruiz",
    building: "Centro de Computo",
    buildingCode: "CC",
    room: "Sala 3",
    time: "10:00 - 12:00",
    day: "Lunes",
  },
  {
    id: "4",
    name: "Quimica",
    professor: "Dra. Jimenez Torres",
    building: "Laboratorio de Ing Quimica",
    buildingCode: "LAB-Q",
    room: "Lab 2",
    time: "12:00 - 14:00",
    day: "Martes",
  },
  {
    id: "5",
    name: "Taller de Etica",
    professor: "Lic. Fernandez Ortiz",
    building: "Edificio H",
    buildingCode: "H",
    room: "H-105",
    time: "14:00 - 15:00",
    day: "Martes",
  },
];

const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

interface SchedulePanelProps {
  expanded?: boolean;
  onNavigateToClass?: (buildingId: string) => void;
}

export function SchedulePanel({ expanded = false, onNavigateToClass }: SchedulePanelProps) {
  const [selectedDay, setSelectedDay] = useState("Lunes");
  
  const todayClasses = mockSchedule.filter((c) => c.day === selectedDay);

  return (
    <div className={`schedule-panel ${expanded ? "schedule-panel--expanded" : ""}`}>
      <div className="schedule-panel__header">
        <h3 className="schedule-panel__title">
          <ClockIcon size={18} />
          <span>Horario de Clases</span>
        </h3>
      </div>

      <div className="schedule-panel__days">
        {days.map((day) => (
          <button
            key={day}
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
            <p>No tienes clases este dia</p>
          </div>
        ) : (
          todayClasses.map((classItem) => (
            <div key={classItem.id} className="schedule-class">
              <div className="schedule-class__time">
                <span>{classItem.time.split(" - ")[0]}</span>
                <span className="schedule-class__time-end">{classItem.time.split(" - ")[1]}</span>
              </div>
              <div className="schedule-class__content">
                <h4 className="schedule-class__name">{classItem.name}</h4>
                <p className="schedule-class__professor">{classItem.professor}</p>
                <div className="schedule-class__location">
                  <span className="schedule-class__building-code">{classItem.buildingCode}</span>
                  <span className="schedule-class__room">{classItem.room}</span>
                </div>
              </div>
              <button
                className="schedule-class__navigate"
                onClick={() => onNavigateToClass?.(classItem.buildingCode)}
                title={`Ir a ${classItem.building}`}
              >
                <NavigationIcon size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
