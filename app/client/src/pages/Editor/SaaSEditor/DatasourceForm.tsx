import React from "react";
import styled from "styled-components";
import _, { merge } from "lodash";
import { DATASOURCE_SAAS_FORM } from "constants/forms";
import { SAAS_EDITOR_DATASOURCE_ID_URL } from "./constants";
import FormTitle from "pages/Editor/DataSourceEditor/FormTitle";
import Button from "components/editorComponents/Button";
import AdsButton, { Category } from "components/ads/Button";
import { Datasource } from "entities/Datasource";
import { getFormValues, InjectedFormProps, reduxForm } from "redux-form";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getDatasource, getPluginImages } from "selectors/entitiesSelector";
import { ReduxAction } from "constants/ReduxActionConstants";
import {
  deleteDatasource,
  getOAuthAccessToken,
  redirectAuthorizationCode,
  updateDatasource,
} from "actions/datasourceActions";
import { createActionRequest } from "actions/actionActions";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  ActionButton,
  FormTitleContainer,
  Header,
  JSONtoForm,
  JSONtoFormProps,
  PluginImage,
  SaveButtonContainer,
} from "../DataSourceEditor/JSONtoForm";
import { getConfigInitialValues } from "components/formControls/utils";
import {
  SAAS_AUTHORIZATION_APPSMITH_ERROR,
  SAAS_AUTHORIZATION_FAILED,
} from "constants/messages";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { Action, PluginType } from "entities/Action";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Connected from "../DataSourceEditor/Connected";
import { Colors } from "constants/Colors";
import { redirectToNewIntegrations } from "../../../actions/apiPaneActions";

interface StateProps extends JSONtoFormProps {
  isSaving: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  isNewDatasource: boolean;
  pluginImage: string;
  pluginId: string;
  actions: ActionDataState;
  datasource?: Datasource;
}

interface DispatchFunctions {
  updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) => void;
  deleteDatasource: (id: string, onSuccess?: ReduxAction<unknown>) => void;
  getOAuthAccessToken: (id: string) => void;
  createAction: (data: Partial<Action>) => void;
  redirectToNewIntegrations: (applicationId: string, pageId: string) => void;
}

type DatasourceSaaSEditorProps = StateProps &
  DispatchFunctions &
  RouteComponentProps<{
    datasourceId: string;
    applicationId: string;
    pageId: string;
    pluginPackageName: string;
  }>;

type Props = DatasourceSaaSEditorProps &
  InjectedFormProps<Datasource, DatasourceSaaSEditorProps>;

const StyledButton = styled(Button)`
  &&&& {
    width: 180px;
    height: 32px;
  }
`;

const EditDatasourceButton = styled(AdsButton)`
  padding: 10px 20px;
  &&&& {
    height: 32px;
    max-width: 160px;
    border: 1px solid ${Colors.HIT_GRAY};
    width: auto;
  }
`;

class DatasourceSaaSEditor extends JSONtoForm<Props> {
  componentDidMount() {
    super.componentDidMount();
    const search = new URLSearchParams(this.props.location.search);
    const status = search.get("response_status");

    if (status) {
      const display_message = search.get("display_message");
      // Set default error message
      let message = SAAS_AUTHORIZATION_FAILED;
      const variant = Variant.danger;
      if (status !== "success") {
        if (status === "appsmith_error") {
          message = SAAS_AUTHORIZATION_APPSMITH_ERROR;
        }
        Toaster.show({ text: display_message || message, variant });
      } else {
        this.props.getOAuthAccessToken(this.props.match.params.datasourceId);
      }
      AnalyticsUtil.logEvent("GSHEET_AUTH_COMPLETE", {
        applicationId: _.get(this.props, "match.params.applicationId"),
        datasourceId: _.get(this.props, "match.params.datasourceId"),
        pageId: _.get(this.props, "match.params.pageId"),
      });
    }
  }

  save = (onSuccess?: ReduxAction<unknown>) => {
    const normalizedValues = this.normalizeValues();
    this.props.updateDatasource(normalizedValues, onSuccess);
  };

  render() {
    const { formConfig } = this.props;
    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content);
  }

  renderDataSourceConfigForm = (sections: any) => {
    const {
      deleteDatasource,
      isDeleting,
      isSaving,
      match: {
        params: { applicationId, datasourceId, pageId, pluginPackageName },
      },
    } = this.props;

    const params: string = location.search;
    const viewMode = new URLSearchParams(params).get("viewMode");
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Header>
          <FormTitleContainer>
            <PluginImage alt="Datasource" src={this.props.pluginImage} />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>
          {viewMode && (
            <EditDatasourceButton
              category={Category.tertiary}
              className="t--edit-datasource"
              onClick={() => {
                this.props.history.replace(
                  SAAS_EDITOR_DATASOURCE_ID_URL(
                    applicationId,
                    pageId,
                    pluginPackageName,
                    datasourceId,
                    {
                      viewMode: false,
                    },
                  ),
                );
              }}
              text="EDIT"
            />
          )}
        </Header>
        {!viewMode ? (
          <>
            {!_.isNil(sections)
              ? _.map(sections, this.renderMainSection)
              : null}
            <SaveButtonContainer>
              <ActionButton
                accent="error"
                className="t--delete-datasource"
                loading={isDeleting}
                onClick={() =>
                  deleteDatasource(
                    datasourceId,
                    this.props.redirectToNewIntegrations(
                      applicationId,
                      pageId,
                    ) as any,
                  )
                }
                text="删除"
              />
              <StyledButton
                className="t--save-datasource"
                disabled={this.validate()}
                filled
                intent="primary"
                loading={isSaving}
                onClick={() => {
                  AnalyticsUtil.logEvent("GSHEET_AUTH_INIT", {
                    applicationId,
                    datasourceId,
                    pageId,
                  });
                  this.save(
                    redirectAuthorizationCode(
                      pageId,
                      datasourceId,
                      PluginType.SAAS,
                    ),
                  );
                }}
                size="small"
                text="继续"
              />
            </SaveButtonContainer>
          </>
        ) : (
          <Connected />
        )}
      </form>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const datasource = getDatasource(state, props.match.params.datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_SAAS_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const formConfig = formConfigs[pluginId];
  const initialValues = {};
  if (formConfig) {
    merge(initialValues, getConfigInitialValues(formConfig));
  }
  merge(initialValues, datasource);
  return {
    datasource,
    isSaving: datasources.loading,
    isDeleting: datasources.isDeleting,
    formData: formData,
    formConfig,
    isNewDatasource:
      datasourcePane.newDatasource === props.match.params.datasourceId,
    pluginImage: getPluginImages(state)[pluginId],
    initialValues,
    pluginId: pluginId,
    actions: state.entities.actions,
    formName: DATASOURCE_SAAS_FORM,
  };
};

const mapDispatchToProps = (dispatch: any): DispatchFunctions => {
  return {
    deleteDatasource: (id: string, onSuccess?: ReduxAction<unknown>) =>
      dispatch(deleteDatasource({ id }, onSuccess)),
    updateDatasource: (formData: any, onSuccess?: ReduxAction<unknown>) =>
      dispatch(updateDatasource(formData, onSuccess)),
    getOAuthAccessToken: (datasourceId: string) =>
      dispatch(getOAuthAccessToken(datasourceId)),
    createAction: (data: Partial<Action>) => {
      dispatch(createActionRequest(data));
    },
    redirectToNewIntegrations: (applicationId: string, pageId: string) => {
      dispatch(redirectToNewIntegrations(applicationId, pageId));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<Datasource, DatasourceSaaSEditorProps>({
    form: DATASOURCE_SAAS_FORM,
    enableReinitialize: true,
  })(DatasourceSaaSEditor),
);
