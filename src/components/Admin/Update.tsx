import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Admin from './Admin';
import ServerError from '../../components/Error/ServerError';

import * as Types from '../../types';
import * as api from '../../api/admin';
import { useAlert } from '../../hooks';

interface URLParams {
  id: string;
}

const AdminUpdateContainer = () => {
  const { alertSuccess, alertError } = useAlert();
  const { id }: URLParams = useParams();
  const [admin, setAdmin] = useState<Types.Admin | undefined>(undefined);
  const [error, setError] = useState<Types.ServerError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;

        const response = await api.fetchAdmin(id);

        if (!response) {
          setError({ code: 404, message: 'Not found' });
          return;
        }
        setAdmin(response);
      } catch (error: any) {
        alertError(error.toString());
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (data: Types.Admin) => {
    try {
      setLoading(true);
      await api.updateAdmin({ ...data, id });

      alertSuccess('Update success');
    } catch (error: any) {
      alertError(error?.toString());
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <ServerError {...error} />;
  }

  return (
    <Admin
      admin={admin}
      submitBtnText="Update"
      submitBtnLoadingText="Updating"
      loading={loading}
      handleSubmitProp={handleSubmit}
    />
  );
};

export default AdminUpdateContainer;
