<template>
  <v-container>
    <v-layout justify-center>
      <v-flex md6>
        <h1 id="getting-started">Getting started</h1>
        <ul>
          <li>
            <a-extended href="#login-optional">Login (optional)</a-extended>
          </li>
          <li>
            <a-extended
              href="#interactive-cell-factory-design-and-omics-data-integration"
              >Interactive cell factory design and omics data
              integration</a-extended
            >
          </li>
          <li>
            <a-extended href="#computational-cell-factory-design"
              >Computational cell factory design</a-extended
            >
          </li>
          <li>
            <a-extended href="#assessing-the-capabilities-of-cell-factories"
              >Assessing the capabilities of cell factories</a-extended
            >
          </li>
          <li>
            <a-extended href="#uploading-data">Uploading data</a-extended>
          </li>
        </ul>

        <p>
          Welcome to our cell factory design and analysis platform! We develop
          the platform as part of the
          <a-extended href="http://dd-decaf.eu">DD-DeCaF</a-extended>
          project with the goal to put model-guided and data-driven design into
          practice in industrial biotechnology. The platform will enable the
          following key technologies:
        </p>
        <ul>
          <li>
            Metagenomics-enabled design of novel enzymes and biochemical
            pathways.
          </li>
          <li>
            Omics data-driven design of cell factories for the production of
            chemicals and proteins.
          </li>
          <li>
            Analysis and design of microbial communities relevant to human
            health, industrial biotechnology and agriculture.
          </li>
        </ul>

        <p>
          With this interactive web application, we target primarily non-expert
          users that have a need to analyze omics data and compute strains
          designs. An advance programming interface is provided for expert users
          (<a-extended href="https://docs.dd-decaf.eu/">API docs</a-extended>)
          enabling them deviate from the default workflows and perform custom
          analyses.
        </p>
        <p>
          The platform is currently in <strong>beta</strong> and tested
          primarily with Google Chrome. If you&#39;d like to stay up-to-date
          with new releases, please
          <a-extended href="https://tinyletter.com/dd-decaf"
            >subscribe</a-extended
          >
          to our quarterly newsletter. We will be eternally grateful for
          feedback in case you miss features or you encountered a problem (for
          now please drop us a message at
          <a-extended href="mailto:niso@biosustain.dtu.dk"
            >niso@biosustain.dtu.dk</a-extended
          >).
        </p>
        <p>
          The following sections provide an overview of what you can currently
          do on platform. Have fun!
        </p>
        <h3 id="login-optional-">Login (optional)</h3>
        <p>
          You can log in <a-extended appOpenLoginDialog>here</a-extended> or by
          navigating to the menu in the upper right-hand corner. We support
          sign-on through a number of social media platforms. Alternatively, you
          can
          <a-extended href="mailto:niso@biosustain.dtu.dk">contact</a-extended>
          us for an account.
        </p>
        <img
          src="../assets/gifs/login.gif"
          alt="Login screencast"
          width="650"
        />

        <p>
          Logging in is optional, (you can browse public domain data and run
          simulations) but necessary for uploading your own data.
        </p>
        <h3 id="interactive-cell-factory-design-and-omics-data-integration">
          Interactive cell factory design and omics data integration
        </h3>
        <p>
          In the
          <a-extended href="https://caffine.dd-decaf.eu/app/pathwayvis"
            >Interactive Map</a-extended
          >
          we utilize metabolic pathway maps as an intuitive user interface for
          model simulation and data analysis, giving biologists the ability to
          modify models in a visual way instead of writing programming code. For
          example, reactions can be deleted from the host organism.
        </p>
        <img
          src="../assets/gifs/knockout.gif"
          alt="Reaction knockout"
          width="650"
        />

        <p>
          All modifications can be undone (for example the reaction deletion).
        </p>
        <img
          src="../assets/gifs/undo-knockout.gif"
          alt="Reaction knockout"
          width="650"
        />

        <p>
          The side panel on the left provides the user with additional
          information (for example the medium composition) and the ability to
          select different model simulation methods. The default simulation
          method,
          <a-extended href="http://cobramethods.wikidot.com/pfba"
            >pFBA
          </a-extended>
          (<em>parsimonious flux balance analysis</em>), will compute a flux
          distribution that maximizes growth yield and minimizes the cost of
          enzyme expression simultaneously. Descriptions of the other available
          methods will follow shortly.
        </p>
        <img
          src="../assets/gifs/side-panel-medium-simulation-methods.gif"
          alt="Reaction knockout"
          width="650"
        />

        <p>
          Computationally more extensive methods can be chosen to get
          uncertainty estimates for the predicted fluxes. For example, pFBA-FVA
          combines
          <a-extended href="http://cobramethods.wikidot.com/pfba"
            >pFBA</a-extended
          >
          with
          <a-extended
            href="http://cobramethods.wikidot.com/flux-variability-analysis"
            >FVA</a-extended
          >
          (<em>flux variability analysis</em>). Uncertain
          <a-extended href="https://en.wikipedia.org/wiki/Flux_(metabolism)"
            >metabolic fluxes</a-extended
          >
          are highlighted using transparency.
        </p>
        <img
          src="../assets/gifs/pfba-fva.gif"
          alt="Reaction knockout"
          width="650"
        />

        <p>
          In addition to central carbon metabolism, the side panel provides an
          extended selection of pathway maps the user can explore. For example
          amino acid biosynthesis:
        </p>
        <img
          src="../assets/gifs/amino-acids-pathway.gif"
          alt="Select amino acid biosynthesis map"
          width="650"
        />

        <p>
          You can search the map by pressing Control-F (Command-F on Mac).
          <em
            >The arrow buttons for cycling through the matches are currently not
            visible. This will be fixed soon.</em
          >
        </p>
        <img
          src="../assets/gifs/searching-on-pathway.gif"
          alt="Select amino acid biosynthesis map"
          width="650"
        />

        <p>
          Furthermore, heterologous reactions can be added on the fly which in
          combination with reaction deletions (see above) facilitates manual
          strain design.
        </p>
        <img
          src="../assets/gifs/add-reaction.gif"
          alt="Add pyruvate carboxylase"
          width="650"
        />

        <p>
          The application furthermore allows the user to analyze and integrate
          data with models (see below for how to upload data to the platform)
          and utilize animation to compare different data sets.
        </p>
        <img
          src="../assets/gifs/data-driven-card-animation.gif"
          alt="Data-driven simulation plus animation"
          width="650"
        />

        <h3 id="computational-cell-factory-design">
          Computational cell factory design
        </h3>
        <p>
          In the
          <a-extended href="https://caffine.dd-decaf.eu/app/pathways"
            >Pathways</a-extended
          >
          application you can predict metabolic routes to products that your
          host can not natively produce and share with the
          <a-extended href="https://caffine.dd-decaf.eu/app/pathwayvis"
            >Interactive Map</a-extended
          >
          application for further inspection.
        </p>
        <img
          src="../assets/gifs/pathways.gif"
          alt="Predicting heterologous pathways screencast"
          width="650"
        />

        <p>
          In the near future, we will transform this application into a
          full-fledged computational strain design tool enabling the
          identification of gene deletion and expression modulation strategies
          (in addition to the pathway predictions).
        </p>
        <h3 id="assessing-the-capabilities-of-cell-factories">
          Assessing the capabilities of cell factories
        </h3>
        <p>
          The
          <a-extended href="https://caffine.dd-decaf.eu/app/yields"
            >Theoretical Yield</a-extended
          >
          application enables you to evaluate your strain performance in the
          context of the theoretical production and growth limits.
        </p>
        <img
          src="../assets/gifs/theoretical-yield-app.gif"
          alt="Theoretical yield app"
          width="650"
        />

        <h3 id="uploading-data">Uploading data</h3>
        <p>
          The
          <a-extended href="https://caffine.dd-decaf.eu/app/upload"
            >Upload data</a-extended
          >
          application will appear in the left panel after you log in. It
          supports a number of different data types and experimental meta data.
        </p>
        <img
          src="../assets/gifs/upload-data.gif"
          alt="Uploading data"
          width="650"
        />

        <p>
          If you're not comfortable uploading proprietary data, please get in
          touch with us (<a-extended href="mailto:niso@biosustain.dtu.dk"
            >niso@biosustain.dtu.dk</a-extended
          >) as our platform can easily be deployed to your own infrastructure.
        </p>
      </v-flex>
    </v-layout>
  </v-container>
</template>
