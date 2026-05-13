type UpdateDetail = {
  id: number;
  type: "update";
  at: string;
};

declare global {
  var __tontineEventTarget: EventTarget | undefined;
  var __tontineLastEventId: number | undefined;
}

function getTarget(): EventTarget {
  if (!global.__tontineEventTarget) global.__tontineEventTarget = new EventTarget();
  return global.__tontineEventTarget;
}

function nextId(): number {
  global.__tontineLastEventId = (global.__tontineLastEventId ?? 0) + 1;
  return global.__tontineLastEventId;
}

export function publishUpdate(): UpdateDetail {
  const detail: UpdateDetail = { id: nextId(), type: "update", at: new Date().toISOString() };
  const ev = new CustomEvent<UpdateDetail>("update", { detail });
  getTarget().dispatchEvent(ev);
  return detail;
}

export function onUpdate(handler: (detail: UpdateDetail) => void): () => void {
  const listener = (e: Event) => {
    const ce = e as CustomEvent<UpdateDetail>;
    handler(ce.detail);
  };
  getTarget().addEventListener("update", listener);
  return () => getTarget().removeEventListener("update", listener);
}
