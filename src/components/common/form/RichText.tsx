import { Control, Controller } from 'react-hook-form';

import { TextFieldProps } from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

type Props = {
  control: Control | any;
  name: string;
  label?: string;
  type?: 'text' | 'password' | 'number';
  fullWidth?: boolean;
  variant?: TextFieldProps['variant'];
  isError: boolean;
  errorMessage?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  tooltipHelp?: string;
  readOnly: boolean;
  onEditorStateChange?: (e: EditorState) => void;
  defaultValue?: string;
};

function isJSON(data: any) {
  var ret = true;
  try {
    JSON.parse(data);
  } catch (e) {
    ret = false;
  }
  return ret;
}

const RichText: React.FC<Props & TextFieldProps> = ({
  control,
  name,
  label,
  fullWidth = true,
  type = 'text',
  variant = 'outlined',
  isError,
  errorMessage,
  startIcon,
  endIcon,
  tooltipHelp,
  onEditorStateChange,
  readOnly,
  defaultValue,
  ...rest
}) => {
  return (
    <Controller
      render={({ field }) => {
        const defaultValueFormat =
          defaultValue && isJSON(defaultValue)
            ? JSON.parse(defaultValue)
            : defaultValue
            ? JSON.parse(`{
            "entityMap":{},
            "blocks":[{
                "key":"1ljs",
                "text": "${defaultValue}",
                "type":"unstyled",
                "depth":0,
                "inlineStyleRanges":[],
                "entityRanges":[],
                "data":{}
            }]
        }`)
            : JSON.parse(`{
            "entityMap":{},
            "blocks":[{
                "key":"1ljs",
                "text":"",
                "type":"unstyled",
                "depth":0,
                "inlineStyleRanges":[],
                "entityRanges":[],
                "data":{}
            }]
        }`);

        /* const onEditorStateChange = (editorState: EditorState) => {
          onChange(JSON.stringify(convertToRaw(editorState.getCurrentContent())))
        }; */
        return (
          <>
            <InputLabel htmlFor={name}>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: '14px',
                  color: '#000',
                  fontWeight: 400,
                  marginBottom: 3,
                }}
              >
                {label}
                {rest.required ? ' *' : ''}
              </div>
              {tooltipHelp ? (
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: '12px',
                    color: '#405166',
                    marginBottom: 5,
                    letterSpacing: '0.15px',
                  }}
                >
                  {tooltipHelp}
                </div>
              ) : null}
            </InputLabel>

            <Editor
              defaultContentState={defaultValueFormat}
              onEditorStateChange={onEditorStateChange}
              readOnly={readOnly}
              toolbar={{
                options: [
                  'inline',
                  'blockType',
                  'fontSize',
                  'list',
                  'textAlign',
                  'colorPicker',
                  'link',
                  'emoji',
                  'image',
                  'remove',
                  'history',
                ],
                inline: { inDropdown: true },
                list: { inDropdown: true },
                textAlign: { inDropdown: true },
                link: { inDropdown: true },
                history: { inDropdown: true },
              }}
              wrapperStyle={{
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: 4,
              }}
              editorStyle={{ padding: '0 14px 18.5px', minHeight: 120 }}
            />
          </>
        );
      }}
      control={control}
      name={name}
    />
  );
};

export default RichText;
