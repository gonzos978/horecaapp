export interface ITask {
  readonly id: string;
  readonly title: string;
  readonly done: boolean;
  readonly hasInput?: boolean;
  readonly photoRequired?: boolean;
  readonly temp?: string;
}

export type TTaskType =
  | "admin"
  | "customer"
  | "waiter"
  | "manager"
  | "cook"
  | "housekeeping";

export type TaskListByType = {
  [key in TTaskType]: ITask[];
};

export const TASK_LIST_BY_TYPE: TaskListByType = {
  admin: [],
  customer: [],
  waiter: [
    {
      id: "uniform",
      title: "Obukao radnu uniformu",
      done: false,
    },
    {
      id: "cleanHall",
      title: "Provjerio čistoću sale/ljetne bašte",
      done: false,
    },
    {
      id: "checkTables",
      title: "Provjerio stolove, karanfinge, promo materijale",
      done: false,
    },
    {
      id: "barReview",
      title: "Pregledao stanje šanka i popisa",
      done: false,
    },
    {
      id: "kitchenReview",
      title: "Upoznao se sa stanjem jela u kuhinji",
      done: false,
    },
  ],
  manager: [
    {
      id: "shiftReport",
      title: "Pregled izvještaja smjene",
      done: false,
    },
    {
      id: "weeklySchedule",
      title: "Odobri raspored za narednu sedmicu",
      done: false,
    },
    {
      id: "inventoryCheck",
      title: "Pregled inventara",
      done: false,
    },
    {
      id: "costAnalysis",
      title: "Analiza troškova",
      done: false,
    },
    {
      id: "teamBriefing",
      title: "Meeting sa timom - briifing",
      done: false,
    },
  ],
  cook: [
    {
      id: "fridgeTemp1",
      title: "Provjeri temp frižidera #1",
      done: false,
      hasInput: true,
      temp: "",
    },
    {
      id: "fridgeTemp2",
      title: "Provjeri temp frižidera #2",
      done: false,
      hasInput: true,
      temp: "",
    },
    {
      id: "cleanSurface",
      title: "Očisti radnu površinu",
      done: false,
      photoRequired: true,
    },
    {
      id: "sanitizeArea",
      title: "Dezinfekcija",
      done: false,
      photoRequired: true,
    },
    {
      id: "prepIngredients",
      title: "Pripremi sastojke za dan",
      done: false,
    },
  ],

  housekeeping: [
    {
      id: "changeLinen",
      title: "Promijeni posteljinu",
      done: false,
    },
    {
      id: "cleanBathroom",
      title: "Očisti kupaonicu",
      done: false,
      photoRequired: true,
    },
    {
      id: "vacuumCarpet",
      title: "Usisaj tepih",
      done: false,
    },
    {
      id: "checkMinibar",
      title: "Provjeri mini-bar",
      done: false,
    },
    {
      id: "welcomeNote",
      title: "Ostavi welcome note",
      done: false,
    },
  ],
};
