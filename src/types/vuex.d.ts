import { DesignsState } from "@/store//modules/designs";
import { ExperimentsState } from "@/store/modules/experiments";
import { InteractiveMapState } from "@/store/modules/interactiveMap";
import { JobsState } from "@/store/modules/jobs";
import { MapState } from "@/store/modules/maps";
import { MediaState } from "@/store/modules/media";
import { ModelsState } from "@/store/modules/models";
import { OrganismsState } from "@/store/modules/organisms";
import { ProjectsState } from "@/store/modules/projects";
import { SessionState } from "@/store/modules/session";
import { StrainsState } from "@/store/modules/strains";

// Fix for when using rootState in a Vuex module, TypeScript doesn't know
// about the other modules
export type RootState = {
  designs: DesignsState;
  experiments: ExperimentsState;
  interactiveMap: InteractiveMapState;
  jobs: JobsState;
  maps: MapState;
  media: MediaState;
  models: ModelsState;
  organisms: OrganismsState;
  projects: ProjectsState;
  session: SessionState;
  strains: StrainsState;
};
