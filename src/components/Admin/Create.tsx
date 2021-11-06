import { useState } from 'react';
import Admin from './Admin';
import * as Types from '../../types';
import * as api from '../../api/admin';
import { useHistory } from 'react-router-dom';
import { useAlert } from '../../hooks';

const AdminAddContainer = () => {
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(false);
  const { alertSuccess, alertError } = useAlert();

  const handleSubmit = async (data: Types.Admin) => {
    try {
      setLoading(true);
      await api.createAdmin(data);

      alertSuccess('Create success');
      history.goBack();
    } catch (error) {
      alertError(error.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Admin submitBtnText="Create" submitBtnLoadingText="Creating" loading={loading} handleSubmitProp={handleSubmit} />
  );
};

export default AdminAddContainer;
